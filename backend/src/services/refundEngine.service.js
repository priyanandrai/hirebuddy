import prisma from '../utils/prisma.js';
import { getPaymentGateway } from '../payments/PaymentGatewayFactory.js';
import { postJournalEntry } from './ledger.service.js';
import { assertIntegerPaise, multiplyBpsRound } from '../utils/cryptoVault.js';
import { generateCreditNoteForRefund } from './invoice.service.js';

/**
 * Default configurable cancellation rules (basis points of customer payment refundable)
 */
export const CANCELLATION_REFUND_MATRIX = {
  BEFORE_ACCEPTANCE: { refundableBps: 10000, penaltyBps: 0 }, // 100% refund
  AFTER_ACCEPTANCE: { refundableBps: 9000, penaltyBps: 1000 }, // 90% refund, 10% cancellation fee
  LATE_CANCELLATION: { refundableBps: 7500, penaltyBps: 2500 }, // 75% refund, 25% cancellation fee
  HELPER_CANCELLED: { refundableBps: 10000, penaltyBps: 0 }, // 100% refund
  HELPER_NO_SHOW: { refundableBps: 10000, penaltyBps: 0 }, // 100% refund (Scenario 13)
  PARTIAL_COMPLETION: { refundableBps: 5000, penaltyBps: 5000 }, // Default 50% unless customRefundPaise specified
  DISPUTE: { refundableBps: 10000, penaltyBps: 0 }, // Full or custom admin-approved refund
  CHARGEBACK: { refundableBps: 10000, penaltyBps: 0 }, // Scenario 22
};

/**
 * Process a Full or Partial Refund, Cancellation, or Chargeback.
 * Supports:
 * - Scenario 9: Booking cancellation before service starts
 * - Scenario 10: Partial refund
 * - Scenario 11: Full refund
 * - Scenario 12: Customer disputes service completion
 * - Scenario 13: Helper does not complete the service
 * - Scenario 21: Customer receives a refund AFTER helper payout was already settled (creates RefundAdjustment recovery!)
 * - Scenario 22: Chargeback or payment dispute
 * - Non-refundable gateway fee retention (gatewayFeePaise is never assumed refunded by gateway)
 */
export async function processMarketplaceRefund({
  paymentId,
  requestedById,
  cancelledByRole = 'USER', // 'USER' | 'HELPER' | 'ADMIN'
  cancellationStage = 'BEFORE_ACCEPTANCE',
  customRefundPaise = null,
  refundPercentageBps = null,
  reason = 'Customer requested cancellation',
  approvedByAdminId = null,
  idempotencyKey = null,
}) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      task: true,
      helperPayouts: true,
    },
  });

  if (!payment) {
    throw new Error('Payment not found');
  }

  const originalPaidPaise = assertIntegerPaise(payment.amount, 'payment.amount');
  const alreadyRefundedPaise = assertIntegerPaise(
    payment.refundedAmountPaise || 0,
    'refundedAmountPaise'
  );
  const maxRemainingRefundablePaise = originalPaidPaise - alreadyRefundedPaise;

  if (maxRemainingRefundablePaise <= 0) {
    throw new Error('Payment has already been fully refunded');
  }

  // 1. Determine refundable customer amount in integer paise
  let refundableCustomerPaise = maxRemainingRefundablePaise;
  if (customRefundPaise !== null && customRefundPaise !== undefined) {
    refundableCustomerPaise = Math.min(
      maxRemainingRefundablePaise,
      assertIntegerPaise(customRefundPaise, 'customRefundPaise')
    );
  } else if (refundPercentageBps !== null && refundPercentageBps !== undefined) {
    refundableCustomerPaise = Math.min(
      maxRemainingRefundablePaise,
      multiplyBpsRound(originalPaidPaise, refundPercentageBps)
    );
  } else {
    const matrixRule =
      CANCELLATION_REFUND_MATRIX[cancellationStage] ||
      CANCELLATION_REFUND_MATRIX.BEFORE_ACCEPTANCE;
    refundableCustomerPaise = Math.min(
      maxRemainingRefundablePaise,
      multiplyBpsRound(originalPaidPaise, matrixRule.refundableBps)
    );
  }

  if (refundableCustomerPaise <= 0) {
    throw new Error('Calculated refundable amount is zero');
  }

  // Proportional ratio in basis points (0..10000) of the original payment being refunded
  const refundRatioBps = Math.round((refundableCustomerPaise * 10000) / originalPaidPaise);
  const refundType =
    refundableCustomerPaise === originalPaidPaise ? 'FULL' : 'PARTIAL';
  const cancellationPenaltyPaise =
    alreadyRefundedPaise === 0 ? originalPaidPaise - refundableCustomerPaise : 0;

  // 2. Calculate proportional reversals of commission, helper earnings, and taxes (in paise)
  const commissionReversedPaise = multiplyBpsRound(
    payment.commissionPaise || 0,
    refundRatioBps
  );
  const serviceGstReversedPaise = multiplyBpsRound(
    payment.gstOnServicePaise || 0,
    refundRatioBps
  );
  const commissionGstReversedPaise = multiplyBpsRound(
    payment.gstOnCommissionPaise || 0,
    refundRatioBps
  );
  const tcsReversedPaise = multiplyBpsRound(payment.tcsPaise || 0, refundRatioBps);
  const tdsReversedPaise = multiplyBpsRound(payment.tdsPaise || 0, refundRatioBps);
  const helperEarningsAdjustedPaise = multiplyBpsRound(
    payment.netHelperEarningsPaise ||
      Math.max(0, originalPaidPaise - (payment.commissionPaise || 0)),
    refundRatioBps
  );

  // Never assume gateway processing fees are refundable
  const gatewayFeeNonRefundablePaise =
    (payment.gatewayFeePaise || 0) + (payment.gatewayGstPaise || 0);

  // 3. Check if Helper Payout was already settled (Scenario 21) or still on hold
  const settledPayout = (payment.helperPayouts || []).find((p) => p.status === 'SETTLED');
  const heldPayout = (payment.helperPayouts || []).find((p) =>
    ['PENDING', 'ON_HOLD'].includes(p.status)
  );
  const wasHelperAlreadyPaid = Boolean(settledPayout);

  const gateway = getPaymentGateway(payment.provider);
  const resolvedIdempotencyKey =
    idempotencyKey || `rfnd_${payment.id}_${alreadyRefundedPaise + refundableCustomerPaise}`;

  // Execute gateway refund
  const gatewayRefund = await gateway.processRefund({
    gatewayPaymentId: payment.razorpayPaymentId || payment.razorpayOrderId || payment.id,
    amountPaise: refundableCustomerPaise,
    reason,
    idempotencyKey: resolvedIdempotencyKey,
  });

  // If transfer was still on hold in Route, reverse the transfer portion
  let transferReversalId = null;
  if (!wasHelperAlreadyPaid && payment.gatewayTransferId && helperEarningsAdjustedPaise > 0) {
    const rev = await gateway.reverseTransfer({
      gatewayTransferId: payment.gatewayTransferId,
      amountPaise: helperEarningsAdjustedPaise,
    });
    transferReversalId = rev.reversalId;
  }

  // 4. Persist Refund, RefundAdjustment (if post-payout), Credit Note, and Double-Entry Journal
  const result = await prisma.$transaction(async (tx) => {
    const refundRecord = await tx.refund.create({
      data: {
        paymentId: payment.id,
        taskId: payment.taskId,
        requestedById: requestedById || payment.payerId,
        approvedByAdminId,
        idempotencyKey: resolvedIdempotencyKey,
        cancellationStage,
        cancelledByRole,
        refundType,
        reason,
        originalPaidPaise,
        refundableCustomerPaise,
        cancellationPenaltyPaise,
        commissionReversedPaise,
        helperEarningsAdjustedPaise,
        serviceGstReversedPaise,
        commissionGstReversedPaise,
        tcsReversedPaise,
        tdsReversedPaise,
        gatewayFeeNonRefundablePaise,
        gatewayRefundId: gatewayRefund.refundId,
        gatewayTransferReversalId: transferReversalId,
        wasHelperAlreadyPaid,
        status: 'PROCESSED',
        processedAt: new Date(),
      },
    });

    let recoveryAdjustment = null;
    if (wasHelperAlreadyPaid && helperEarningsAdjustedPaise > 0) {
      // Scenario 21: Customer refunded after helper payout settled -> Create recovery adjustment against helper
      recoveryAdjustment = await tx.refundAdjustment.create({
        data: {
          refundId: refundRecord.id,
          helperId: payment.payeeId,
          totalRecoveryPaise: helperEarningsAdjustedPaise,
          recoveredPaise: 0,
          remainingPaise: helperEarningsAdjustedPaise,
          status: 'OPEN',
          notes: `Post-payout refund recovery for Booking ${payment.taskId} (Refund ${refundRecord.id})`,
        },
      });
    } else if (heldPayout) {
      const updatedNet = Math.max(0, heldPayout.netPayoutPaise - helperEarningsAdjustedPaise);
      await tx.helperPayout.update({
        where: { id: heldPayout.id },
        data: {
          refundAdjustmentPaise: { increment: helperEarningsAdjustedPaise },
          netPayoutPaise: updatedNet,
          status: updatedNet === 0 ? 'REVERSED' : heldPayout.status,
        },
      });
    }

    const newTotalRefunded = alreadyRefundedPaise + refundableCustomerPaise;
    const newPaymentStatus =
      cancellationStage === 'CHARGEBACK'
        ? 'CHARGEBACK'
        : newTotalRefunded >= originalPaidPaise
        ? 'REFUNDED'
        : 'PARTIALLY_REFUNDED';

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        refundedAmountPaise: newTotalRefunded,
        status: newPaymentStatus,
        transferHoldStatus:
          newTotalRefunded >= originalPaidPaise ? 'REVERSED' : payment.transferHoldStatus,
      },
    });

    if (newTotalRefunded >= originalPaidPaise || ['BEFORE_ACCEPTANCE', 'AFTER_ACCEPTANCE', 'LATE_CANCELLATION', 'HELPER_NO_SHOW', 'HELPER_CANCELLED'].includes(cancellationStage)) {
      await tx.task.update({
        where: { id: payment.taskId },
        data: {
          status: 'CANCELLED',
          paymentStatus: newPaymentStatus === 'PARTIALLY_REFUNDED' ? 'PARTIALLY_REFUNDED' : 'REFUNDED',
        },
      });
    }

    // Post balanced double-entry journal for Refund / Chargeback
    const helperDebitAccount = wasHelperAlreadyPaid
      ? '1004_HELPER_RECOVERY_RECEIVABLE'
      : '2001_HELPER_PAYABLE';

    const platformGstReversed =
      payment.supplyType === 'ORDINARY_MARKETPLACE'
        ? commissionGstReversedPaise
        : serviceGstReversedPaise + commissionGstReversedPaise;

    const nonRevenueDebits =
      helperEarningsAdjustedPaise +
      platformGstReversed +
      tcsReversedPaise +
      tdsReversedPaise;

    const revenueReversedDebit = Math.max(0, refundableCustomerPaise - nonRevenueDebits);
    const totalDebits = nonRevenueDebits + revenueReversedDebit;

    const journalLines = [];
    if (helperEarningsAdjustedPaise > 0) {
      journalLines.push({
        accountCode: helperDebitAccount,
        debitPaise: helperEarningsAdjustedPaise,
        creditPaise: 0,
        helperId: payment.payeeId,
        gatewayReference: gatewayRefund.refundId,
      });
    }
    if (revenueReversedDebit > 0) {
      journalLines.push({
        accountCode:
          payment.supplyType === 'PRINCIPAL_PROVIDER'
            ? '4002_PRINCIPAL_SERVICE_REVENUE'
            : '4001_PLATFORM_COMMISSION_REVENUE',
        debitPaise: revenueReversedDebit,
        creditPaise: 0,
        customerId: payment.payerId,
      });
    }
    if (platformGstReversed > 0) {
      journalLines.push({
        accountCode: '2002_GST_OUTPUT_PAYABLE',
        debitPaise: platformGstReversed,
        creditPaise: 0,
      });
    }
    if (tcsReversedPaise > 0) {
      journalLines.push({
        accountCode: '2003_GST_TCS_PAYABLE',
        debitPaise: tcsReversedPaise,
        creditPaise: 0,
        helperId: payment.payeeId,
      });
    }
    if (tdsReversedPaise > 0) {
      journalLines.push({
        accountCode: '2004_INCOME_TAX_TDS_PAYABLE',
        debitPaise: tdsReversedPaise,
        creditPaise: 0,
        helperId: payment.payeeId,
      });
    }

    // Credit Customer Payment Clearing (or Chargeback Liability) for the exact totalDebits
    journalLines.push({
      accountCode:
        cancellationStage === 'CHARGEBACK'
          ? '2006_CHARGEBACK_LIABILITY'
          : '1001_CUSTOMER_PAYMENT_CLEARING',
      debitPaise: 0,
      creditPaise: totalDebits,
      customerId: payment.payerId,
      gatewayReference: gatewayRefund.refundId,
    });

    await postJournalEntry(
      {
        eventType: cancellationStage === 'CHARGEBACK' ? 'CHARGEBACK' : 'REFUND_ISSUED',
        bookingId: payment.taskId,
        paymentId: payment.id,
        description: `${refundType} Refund (${cancellationStage}) — Refunded to Customer: ₹${(
          refundableCustomerPaise / 100
        ).toFixed(2)}`,
        lines: journalLines,
        isReversal: true,
      },
      tx
    );

    const creditNote = await generateCreditNoteForRefund(
      {
        payment,
        refund: refundRecord,
      },
      tx
    );

    return {
      success: true,
      refund: refundRecord,
      recoveryAdjustment,
      refundAdjustment: recoveryAdjustment,
      creditNote,
      paymentStatus: newPaymentStatus,
    };
  });

  return result;
}
