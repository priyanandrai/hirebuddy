import prisma from '../utils/prisma.js';
import { getPaymentGateway } from '../payments/PaymentGatewayFactory.js';
import { calculateCompleteBookingBreakdown } from './pricingBreakdown.service.js';
import { recordPaymentCapturedJournal } from './ledger.service.js';
import { generateStatutoryInvoicesForPayment } from './invoice.service.js';
import { getIndianTaxPeriod } from './tdsWithholdingEngine.service.js';
import { processMarketplaceRefund } from './refundEngine.service.js';
import { assertIntegerPaise } from '../utils/cryptoVault.js';
import { sendNotification } from './notification.service.js';
import { emitToUser } from '../config/socket.config.js';

/**
 * Create a Marketplace Booking Payment Order with complete Commission, GST, TCS & TDS calculation.
 * Supports idempotency keys to prevent duplicate orders.
 */
export async function createMarketplacePaymentOrder({
  taskId,
  payerId,
  payeeId = null,
  baseServicePaise = null,
  promoCode = null,
  discountPaise = 0,
  discountFundedBy = 'NONE',
  customerStateCode = 'UP',
  helperStateCode = null,
  commissionGstMode = 'INCLUSIVE',
  idempotencyKey = null,
  providerCode = 'RAZORPAY',
  customCommissionRule = null,
  customTaxRule = null,
  customHelperTaxProfile = null,
}) {
  // 1. Check idempotency key first
  if (idempotencyKey) {
    const existingByIdempotency = await prisma.payment.findFirst({
      where: { idempotencyKey },
    });
    if (existingByIdempotency) {
      return {
        success: true,
        idempotentReplay: true,
        orderId: existingByIdempotency.razorpayOrderId,
        paymentId: existingByIdempotency.id,
        amount: existingByIdempotency.amount,
        currency: existingByIdempotency.currency,
        breakdown: existingByIdempotency.pricingSnapshot,
        payment: existingByIdempotency,
      };
    }
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new Error('Booking (Task) not found');
  }

  const resolvedPayeeId = payeeId || task.assignedToId || task.createdById || payerId;
  const resolvedBasePaise =
    baseServicePaise !== null && baseServicePaise !== undefined
      ? assertIntegerPaise(baseServicePaise, 'baseServicePaise')
      : assertIntegerPaise(task.budget, 'task.budget');

  // 2. Calculate full dynamic Commission, GST, Section 52 TCS & Section 194-O TDS breakdown
  const breakdown = await calculateCompleteBookingBreakdown({
    serviceCategory: task.category,
    baseServicePaise: resolvedBasePaise,
    helperId: resolvedPayeeId !== payerId ? resolvedPayeeId : null,
    customerId: payerId,
    customerStateCode: customerStateCode || task.customerStateCode || 'UP',
    helperStateCode: helperStateCode || task.helperStateCode || null,
    promoCode,
    discountPaise,
    discountFundedBy,
    commissionGstMode,
    customCommissionRule,
    customTaxRule,
    customHelperTaxProfile,
  });

  // 3. Create Gateway Order via Provider Abstraction
  const gateway = getPaymentGateway(providerCode);
  const resolvedKey = idempotencyKey || `ord_${taskId}_${Date.now()}`;

  const gatewayOrder = await gateway.createOrder({
    amountPaise: breakdown.totalCustomerPayablePaise,
    currency: 'INR',
    receipt: `hb_${taskId.slice(0, 8)}_${Date.now()}`,
    idempotencyKey: resolvedKey,
    notes: {
      taskId,
      payerId,
      payeeId: resolvedPayeeId,
      serviceCategory: task.category,
      supplyClassification: breakdown.supplyClassification,
    },
  });

  // 4. Persist Payment, Task pricing snapshot, and PaymentAttempt atomically
  const payment = await prisma.$transaction(async (tx) => {
    const createdPayment = await tx.payment.create({
      data: {
        taskId,
        payerId,
        payeeId: resolvedPayeeId,
        amount: breakdown.totalCustomerPayablePaise,
        currency: 'INR',
        provider: gatewayOrder.provider,
        idempotencyKey: resolvedKey,
        razorpayOrderId: gatewayOrder.orderId,
        status: 'INITIATED',
        method: gatewayOrder.provider.toLowerCase(),
        baseServicePaise: breakdown.baseServicePaise,
        discountPaise: breakdown.discountPaise,
        platformDiscountPaise: breakdown.platformDiscountPaise,
        helperDiscountPaise: breakdown.helperDiscountPaise,
        commissionRateBps: breakdown.commissionRateBps,
        commissionPaise: breakdown.commissionPaise,
        gstOnServicePaise: breakdown.gstOnServicePaise,
        gstOnCommissionPaise: breakdown.gstOnCommissionPaise,
        tcsPaise: breakdown.tcsPaise,
        tdsPaise: breakdown.tdsPaise,
        gatewayFeePaise: breakdown.gatewayFeePaise,
        gatewayGstPaise: breakdown.gatewayGstPaise,
        netHelperEarningsPaise: breakdown.netHelperPayablePaise,
        supplyType: breakdown.supplyClassification,
        placeOfSupplyState: breakdown.placeOfSupplyStateCode,
        isInterState: breakdown.isInterState,
        appliedCommissionRuleId: breakdown.appliedCommissionRuleId,
        appliedTaxRuleId: breakdown.appliedTaxRuleId,
        pricingSnapshot: breakdown,
      },
    });

    await tx.paymentAttempt.create({
      data: {
        paymentId: createdPayment.id,
        provider: gatewayOrder.provider,
        idempotencyKey: `att_${resolvedKey}`,
        gatewayOrderId: gatewayOrder.orderId,
        amountPaise: breakdown.totalCustomerPayablePaise,
        currency: 'INR',
        status: 'INITIATED',
        rawResponse: gatewayOrder.raw || gatewayOrder,
      },
    });

    await tx.task.update({
      where: { id: taskId },
      data: {
        razorpayOrderId: gatewayOrder.orderId,
        baseServicePaise: breakdown.baseServicePaise,
        discountPaise: breakdown.discountPaise,
        platformFundedDiscountPaise: breakdown.platformDiscountPaise,
        helperFundedDiscountPaise: breakdown.helperDiscountPaise,
        commissionPaise: breakdown.commissionPaise,
        gstOnServicePaise: breakdown.gstOnServicePaise,
        gstOnCommissionPaise: breakdown.gstOnCommissionPaise,
        tcsPaise: breakdown.tcsPaise,
        tdsPaise: breakdown.tdsPaise,
        totalChargedPaise: breakdown.totalCustomerPayablePaise,
        netHelperPayablePaise: breakdown.netHelperPayablePaise,
        supplyType: breakdown.supplyClassification,
        customerStateCode: breakdown.placeOfSupplyStateCode,
        helperStateCode: breakdown.supplierStateCode,
        appliedCommissionRuleId: breakdown.appliedCommissionRuleId,
        appliedTaxRuleId: breakdown.appliedTaxRuleId,
      },
    });

    return createdPayment;
  });

  return {
    success: true,
    idempotentReplay: false,
    orderId: gatewayOrder.orderId,
    paymentId: payment.id,
    amount: gatewayOrder.amountPaise,
    currency: gatewayOrder.currency,
    breakdown,
    payment,
  };
}

/**
 * Confirm & Settle a Captured Payment into Route Hold + Double-Entry Ledger + Tax/TDS Records + Invoices.
 * Safe against concurrent/delayed/duplicate calls (idempotent on payment status).
 * Never initiates helper bank payout merely because customer paid — creates Route transfer with onHold: true!
 */
export async function finalizeCapturedMarketplacePayment({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature = null,
  verifySignature = true,
  simulateBookingConfirmationFailure = false,
}) {
  const existingPayment = await prisma.payment.findFirst({
    where: { razorpayOrderId },
    include: {
      task: true,
      payer: true,
      payee: { include: { helperTaxProfile: true, helperBankAccounts: { where: { isPrimary: true } } } },
    },
  });

  if (!existingPayment) {
    throw new Error(`Payment record not found for order ${razorpayOrderId}`);
  }

  // Idempotency: if already CONFIRMED, HELD_IN_ESCROW, or SETTLED, return existing record without double-posting
  if (['CONFIRMED', 'HELD_IN_ESCROW', 'SETTLED', 'COMPLETED'].includes(existingPayment.status)) {
    return {
      success: true,
      alreadyProcessed: true,
      payment: existingPayment,
    };
  }

  const gateway = getPaymentGateway(existingPayment.provider);

  if (verifySignature) {
    const sigValid = gateway.verifyPaymentSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });
    if (!sigValid) {
      throw new Error('Invalid payment signature');
    }
  }

  // Scenario 17: Customer pays, but booking confirmation fails (e.g., slot already taken or task cancelled)
  if (simulateBookingConfirmationFailure || existingPayment.task?.status === 'CANCELLED') {
    await prisma.payment.update({
      where: { id: existingPayment.id },
      data: {
        razorpayPaymentId,
        razorpaySignature,
        status: 'CONFIRMED',
      },
    });

    // Automatically trigger full refund for failed booking confirmation
    const autoRefund = await processMarketplaceRefund({
      paymentId: existingPayment.id,
      requestedById: existingPayment.payerId,
      cancelledByRole: 'ADMIN',
      cancellationStage: 'BEFORE_ACCEPTANCE',
      reason: 'Automatic full refund: Booking confirmation failed after payment capture',
    });

    return {
      success: false,
      bookingConfirmationFailed: true,
      autoRefunded: true,
      refund: autoRefund.refund,
    };
  }

  // Reconstruct or compute pricing breakdown snapshot
  const breakdown =
    existingPayment.pricingSnapshot ||
    (await calculateCompleteBookingBreakdown({
      serviceCategory: existingPayment.task?.category || 'General Service',
      baseServicePaise: existingPayment.baseServicePaise || existingPayment.amount,
      helperId: existingPayment.payeeId,
      customerId: existingPayment.payerId,
      customerStateCode: existingPayment.placeOfSupplyState || 'UP',
    }));

  // Initiate Razorpay Route transfer with onHold = true (funds remain held in Route until completion)
  const linkedAccountId =
    existingPayment.payee?.helperBankAccounts?.[0]?.razorpayLinkedAccountId ||
    `acc_rzp_${existingPayment.payeeId.replace(/-/g, '').slice(0, 12)}`;

  let routeTransfer = null;
  if (breakdown.netHelperPayablePaise > 0) {
    routeTransfer = await gateway.initiateTransfer({
      gatewayPaymentId: razorpayPaymentId,
      linkedAccountId,
      amountPaise: breakdown.netHelperPayablePaise,
      onHold: true, // Strictly held until service completion & customer confirmation
      idempotencyKey: `trf_hold_${existingPayment.id}`,
      notes: {
        taskId: existingPayment.taskId,
        paymentId: existingPayment.id,
      },
    });
  }

  const { financialYear, quarter, taxPeriod } = getIndianTaxPeriod(new Date());

  // Commit Payment confirmation, TaxTransaction, TaxWithholding, HelperPayout (ON_HOLD), Invoices, and Double-Entry Ledger atomically
  const finalized = await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: existingPayment.id },
      data: {
        razorpayPaymentId,
        razorpaySignature: razorpaySignature || existingPayment.razorpaySignature,
        gatewayTransferId: routeTransfer?.transferId || null,
        transferHoldStatus: 'ON_HOLD',
        status: 'CONFIRMED',
        pricingSnapshot: breakdown,
      },
    });

    await tx.paymentAttempt.updateMany({
      where: { paymentId: existingPayment.id, gatewayOrderId: razorpayOrderId },
      data: {
        gatewayPaymentId: razorpayPaymentId,
        status: 'CAPTURED',
      },
    });

    await tx.task.update({
      where: { id: existingPayment.taskId },
      data: {
        paymentStatus: 'CONFIRMED',
        status:
          existingPayment.task?.status === 'OPEN' && existingPayment.task?.assignedToId
            ? 'ASSIGNED'
            : existingPayment.task?.status,
      },
    });

    // 1. Record TaxTransaction (GST + Section 52 TCS breakup)
    const taxTransaction = await tx.taxTransaction.create({
      data: {
        taskId: existingPayment.taskId,
        paymentId: existingPayment.id,
        taxRuleId: breakdown.appliedTaxRuleId,
        serviceCategory: breakdown.serviceCategory,
        supplyClassification: breakdown.supplyClassification,
        sacCode: breakdown.sacCode,
        supplierStateCode: breakdown.supplierStateCode || 'UP',
        placeOfSupplyStateCode: breakdown.placeOfSupplyStateCode || 'UP',
        isInterState: Boolean(breakdown.isInterState),
        taxLiabilityOwner: breakdown.gstBreakdown?.taxLiabilityOwner || 'HELPER_IF_REGISTERED',
        taxableServiceValuePaise: breakdown.customerDiscountedServicePaise,
        serviceCgstPaise: breakdown.serviceCgstPaise,
        serviceSgstPaise: breakdown.serviceSgstPaise,
        serviceIgstPaise: breakdown.serviceIgstPaise,
        taxableCommissionValuePaise: breakdown.commissionPaise,
        commissionCgstPaise: breakdown.commissionCgstPaise,
        commissionSgstPaise: breakdown.commissionSgstPaise,
        commissionIgstPaise: breakdown.commissionIgstPaise,
        isSection52TcsApplicable: Boolean(breakdown.isSection52TcsApplicable),
        tcsNetTaxableBasePaise: breakdown.gstBreakdown?.tcsNetTaxableBasePaise || 0,
        tcsCgstPaise: breakdown.tcsCgstPaise,
        tcsSgstPaise: breakdown.tcsSgstPaise,
        tcsIgstPaise: breakdown.tcsIgstPaise,
        totalTcsPaise: breakdown.tcsPaise,
        taxPeriod,
      },
    });

    // 2. Record Section 194-O Income-Tax Withholding & update Helper FY Cumulative Gross Turnover
    const taxWithholding = await tx.taxWithholding.create({
      data: {
        helperId: existingPayment.payeeId,
        paymentId: existingPayment.id,
        taskId: existingPayment.taskId,
        section: breakdown.tdsSection || '194-O',
        financialYear,
        quarter,
        grossTransactionPaise: breakdown.tdsGrossBasePaise,
        cumulativeFyGrossPaise: BigInt(breakdown.tdsCumulativeFyGrossPaise || 0),
        panStatus: breakdown.tdsPanStatus,
        tdsRateBps: breakdown.tdsRateBps,
        tdsDeductedPaise: breakdown.tdsPaise,
        status: breakdown.tdsPaise > 0 ? 'DEDUCTED' : 'EXEMPT',
      },
    });

    if (existingPayment.payee?.helperTaxProfile) {
      await tx.helperTaxProfile.update({
        where: { userId: existingPayment.payeeId },
        data: {
          annualGrossTurnoverPaise: {
            increment: BigInt(breakdown.tdsGrossBasePaise || 0),
          },
        },
      });
    }

    // 3. Create HelperPayout record in ON_HOLD (PENDING_COMPLETION) state
    const helperPayout = await tx.helperPayout.create({
      data: {
        helperId: existingPayment.payeeId,
        taskId: existingPayment.taskId,
        paymentId: existingPayment.id,
        idempotencyKey: `payout_${existingPayment.id}`,
        grossServiceValuePaise: breakdown.effectiveHelperServiceBasePaise,
        commissionDeductedPaise: breakdown.commissionPaise,
        gstOnCommissionPaise: breakdown.gstOnCommissionPaise,
        tcsDeductedPaise: breakdown.tcsPaise,
        tdsDeductedPaise: breakdown.tdsPaise,
        helperDiscountPaise: breakdown.helperDiscountPaise,
        refundAdjustmentPaise: 0,
        netPayoutPaise: breakdown.netHelperPayablePaise,
        eligibilityStatus: 'PENDING_COMPLETION',
        holdReason: 'Held in Route settlement until service completion and customer confirmation',
        status: 'ON_HOLD',
        gatewayTransferId: routeTransfer?.transferId || null,
      },
    });

    // 4. Post Immutable Double-Entry Journal
    const ledgerJournal = await recordPaymentCapturedJournal(
      {
        bookingId: existingPayment.taskId,
        paymentId: existingPayment.id,
        customerId: existingPayment.payerId,
        helperId: existingPayment.payeeId,
        gatewayPaymentId: razorpayPaymentId,
        breakdown,
      },
      tx
    );

    // 5. Generate Sequential Statutory Invoices & Helper Payout Statement
    const invoices = await generateStatutoryInvoicesForPayment(
      {
        payment: updatedPayment,
        task: existingPayment.task,
        customer: existingPayment.payer,
        helper: existingPayment.payee,
        helperTaxProfile: existingPayment.payee?.helperTaxProfile,
        breakdown,
      },
      tx
    );

    return {
      payment: updatedPayment,
      taxTransaction,
      taxWithholding,
      helperPayout,
      ledgerJournal,
      invoices,
    };
  });

  // 6. Notify Helper & Customer (Non-blocking)
  try {
    if (existingPayment.payeeId && existingPayment.payeeId !== existingPayment.payerId) {
      await sendNotification(
        existingPayment.taskId,
        existingPayment.payerId,
        existingPayment.payeeId,
        'booking_confirmed',
        'Booking Confirmed & Payment Verified',
        `Customer payment of ₹${(finalized.payment.amount / 100).toFixed(
          2
        )} is verified. Your net earnings of ₹${(
          breakdown.netHelperPayablePaise / 100
        ).toFixed(2)} will be settled upon service completion.`
      );
      emitToUser(existingPayment.payeeId, 'payment_notification', {
        taskId: existingPayment.taskId,
        paymentId: existingPayment.id,
        status: 'CONFIRMED',
        netHelperPayablePaise: breakdown.netHelperPayablePaise,
      });
    }
  } catch {}

  return {
    success: true,
    alreadyProcessed: false,
    ...finalized,
  };
}

/**
 * Process Razorpay Webhook with Raw-Body HMAC Verification & Idempotency (Section 2, 3, 15, 16)
 * Handles:
 * - payment.captured (normal & delayed webhook - Scenario 18, Test #1, #4)
 * - payment.failed (Test #2)
 * - Duplicate webhook eventId (Scenario 19, Test #3)
 * - Invalid webhook signature (Test #5)
 * - payment.dispute.created / chargeback (Scenario 22)
 */
export async function processRazorpayWebhook({
  rawBody,
  signature,
  eventId,
  payload,
  customWebhookSecret = null,
}) {
  const gateway = getPaymentGateway('RAZORPAY');

  // 1. Verify HMAC-SHA256 Webhook Signature before anything else (Test #5)
  const isSignatureValid = gateway.verifyWebhookSignature(
    rawBody,
    signature,
    customWebhookSecret
  );

  if (!isSignatureValid) {
    const err = new Error('INVALID_WEBHOOK_SIGNATURE: Webhook signature verification failed');
    err.statusCode = 400;
    throw err;
  }

  const parsedPayload =
    typeof payload === 'string' ? JSON.parse(payload) : payload || JSON.parse(String(rawBody));

  const resolvedEventId =
    eventId ||
    parsedPayload.id ||
    `evt_${parsedPayload.event}_${
      parsedPayload?.payload?.payment?.entity?.id || Date.now()
    }`;
  const eventType = parsedPayload.event || 'unknown';
  const paymentEntity = parsedPayload?.payload?.payment?.entity || {};
  const gatewayOrderId = paymentEntity.order_id || null;
  const gatewayPaymentId = paymentEntity.id || null;

  // 2. Idempotency check on eventId (Scenario 19 / Test #3)
  const existingEvent = await prisma.paymentWebhookEvent.findUnique({
    where: { eventId: resolvedEventId },
  });

  if (existingEvent && existingEvent.processingStatus === 'PROCESSED') {
    return {
      success: true,
      duplicate: true,
      eventId: resolvedEventId,
      status: 'DUPLICATE_IGNORED',
    };
  }

  const webhookRecord =
    existingEvent ||
    (await prisma.paymentWebhookEvent.create({
      data: {
        eventId: resolvedEventId,
        provider: 'RAZORPAY',
        eventType,
        gatewayOrderId,
        gatewayPaymentId,
        signature,
        signatureValid: true,
        payload: parsedPayload,
        processingStatus: 'RECEIVED',
      },
    }));

  try {
    let result = null;

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      result = await finalizeCapturedMarketplacePayment({
        razorpayOrderId: gatewayOrderId,
        razorpayPaymentId: gatewayPaymentId,
        verifySignature: false, // Already authenticated via webhook HMAC signature
      });
    } else if (eventType === 'payment.failed') {
      if (gatewayOrderId) {
        const payment = await prisma.payment.findFirst({
          where: { razorpayOrderId: gatewayOrderId },
        });
        if (payment && payment.status === 'INITIATED') {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              razorpayPaymentId: gatewayPaymentId,
              status: 'FAILED',
            },
          });
          await prisma.paymentAttempt.updateMany({
            where: { paymentId: payment.id },
            data: {
              gatewayPaymentId,
              status: 'FAILED',
              errorCode: paymentEntity.error_code || 'PAYMENT_FAILED',
              errorDescription: paymentEntity.error_description || 'Customer payment failed',
            },
          });
        }
      }
      result = { status: 'FAILED_RECORDED', gatewayOrderId };
    } else if (eventType === 'payment.dispute.created') {
      // Scenario 22: Chargeback / payment dispute
      if (gatewayPaymentId || gatewayOrderId) {
        const payment = await prisma.payment.findFirst({
          where: gatewayPaymentId ? { razorpayPaymentId: gatewayPaymentId } : { razorpayOrderId: gatewayOrderId },
        });
        if (payment) {
          result = await processMarketplaceRefund({
            paymentId: payment.id,
            requestedById: payment.payerId,
            cancelledByRole: 'ADMIN',
            cancellationStage: 'CHARGEBACK',
            reason: 'Gateway Chargeback / Dispute Created',
          });
        }
      }
    }

    await prisma.paymentWebhookEvent.update({
      where: { id: webhookRecord.id },
      data: {
        processingStatus: 'PROCESSED',
        processedAt: new Date(),
      },
    });

    return {
      success: true,
      duplicate: false,
      eventId: resolvedEventId,
      eventType,
      result,
    };
  } catch (error) {
    await prisma.paymentWebhookEvent.update({
      where: { id: webhookRecord.id },
      data: {
        processingStatus: 'FAILED',
        errorMessage: error.message,
      },
    });
    throw error;
  }
}

/**
 * Fetch complete marketplace payment, tax, TDS, payout, invoice & refund details for a booking
 */
export async function getBookingPaymentDetails(bookingId, requestingUserId, isAdmin = false) {
  const task = await prisma.task.findUnique({
    where: { id: bookingId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      payments: {
        orderBy: { createdAt: 'desc' },
        include: {
          taxTransactions: true,
          taxWithholdings: true,
          helperPayouts: true,
          refunds: true,
          invoices: true,
        },
      },
      invoices: {
        orderBy: { issuedAt: 'desc' },
      },
      helperPayouts: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!task) {
    const err = new Error('Booking not found');
    err.statusCode = 404;
    throw err;
  }

  const isPayer = task.createdById === requestingUserId;
  const isPayee = task.assignedToId === requestingUserId;

  if (!isAdmin && !isPayer && !isPayee) {
    const err = new Error('Forbidden: You do not have permission to view this booking payment');
    err.statusCode = 403;
    throw err;
  }

  const primaryPayment = task.payments[0] || null;

  return {
    bookingId: task.id,
    title: task.title,
    category: task.category,
    bookingStatus: task.status,
    paymentStatus: task.paymentStatus,
    supplyType: task.supplyType,
    pricingSummary: {
      baseServicePaise: task.baseServicePaise || task.budget,
      discountPaise: task.discountPaise,
      platformFundedDiscountPaise: task.platformFundedDiscountPaise,
      helperFundedDiscountPaise: task.helperFundedDiscountPaise,
      commissionPaise: task.commissionPaise,
      gstOnServicePaise: task.gstOnServicePaise,
      gstOnCommissionPaise: task.gstOnCommissionPaise,
      tcsPaise: task.tcsPaise,
      tdsPaise: task.tdsPaise,
      totalChargedPaise: task.totalChargedPaise || primaryPayment?.amount || task.budget,
      netHelperPayablePaise: task.netHelperPayablePaise,
    },
    payment: primaryPayment,
    payments: task.payments,
    invoices: task.invoices,
    helperPayouts: task.helperPayouts,
  };
}

