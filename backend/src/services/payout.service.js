import prisma from '../utils/prisma.js';
import { getPaymentGateway } from '../payments/PaymentGatewayFactory.js';
import { postJournalEntry } from './ledger.service.js';
import {
  assertIntegerPaise,
  encryptSensitiveValue,
  maskBankAccount,
  maskPan,
  hashIdentifier,
  isValidIndianPan,
  isValidIndianGstin,
} from '../utils/cryptoVault.js';

/**
 * Register or update Helper Tax Profile (PAN, GSTIN, Legal Entity Type, State Code)
 * Encrypts and masks PAN before storing.
 */
export async function upsertHelperTaxProfile(
  helperId,
  {
    panNumber,
    legalEntityType = 'INDIVIDUAL',
    isGstRegistered = false,
    gstin = null,
    stateCode = 'UP',
    tdsExemptCertificateNo = null,
    tdsExemptValidUntil = null,
    lowerTdsRateBps = null,
    payoutSchedulePreference = 'ON_COMPLETION',
  } = {}
) {
  let panMasked = undefined;
  let panEncrypted = undefined;
  let panHash = undefined;
  let panVerificationStatus = undefined;

  if (panNumber !== undefined) {
    if (!panNumber) {
      panMasked = null;
      panEncrypted = null;
      panHash = null;
      panVerificationStatus = 'UNVERIFIED';
    } else {
      const cleanPan = String(panNumber).trim().toUpperCase();
      const valid = isValidIndianPan(cleanPan);
      panMasked = maskPan(cleanPan);
      panEncrypted = encryptSensitiveValue(cleanPan);
      panHash = hashIdentifier(cleanPan);
      panVerificationStatus = valid ? 'VERIFIED' : 'INVALID';
    }
  }

  let gstVerificationStatus = 'NOT_APPLICABLE';
  if (isGstRegistered && gstin) {
    gstVerificationStatus = isValidIndianGstin(gstin) ? 'VERIFIED' : 'INVALID';
  }

  return prisma.helperTaxProfile.upsert({
    where: { userId: helperId },
    create: {
      userId: helperId,
      legalEntityType,
      panMasked: panMasked ?? null,
      panEncrypted: panEncrypted ?? null,
      panHash: panHash ?? null,
      panVerificationStatus: panVerificationStatus ?? 'UNVERIFIED',
      isGstRegistered: Boolean(isGstRegistered),
      gstin: gstin ? String(gstin).trim().toUpperCase() : null,
      gstVerificationStatus,
      stateCode: String(stateCode || 'UP').toUpperCase(),
      tdsExemptCertificateNo,
      tdsExemptValidUntil: tdsExemptValidUntil ? new Date(tdsExemptValidUntil) : null,
      lowerTdsRateBps,
      payoutSchedulePreference,
    },
    update: {
      legalEntityType,
      ...(panMasked !== undefined ? { panMasked, panEncrypted, panHash, panVerificationStatus } : {}),
      isGstRegistered: Boolean(isGstRegistered),
      gstin: gstin ? String(gstin).trim().toUpperCase() : null,
      gstVerificationStatus,
      stateCode: String(stateCode || 'UP').toUpperCase(),
      tdsExemptCertificateNo,
      tdsExemptValidUntil: tdsExemptValidUntil ? new Date(tdsExemptValidUntil) : null,
      lowerTdsRateBps,
      payoutSchedulePreference,
    },
  });
}

/**
 * Add or update a Helper Bank Account with AES-256-GCM encryption and account masking
 */
export async function upsertHelperBankAccount(
  helperId,
  {
    beneficiaryName,
    accountNumber,
    ifscCode,
    bankName = null,
    branchName = null,
    upiId = null,
    razorpayLinkedAccountId = null,
    verificationStatus = 'VERIFIED',
  }
) {
  if (!beneficiaryName || !accountNumber || !ifscCode) {
    throw new Error('beneficiaryName, accountNumber, and ifscCode are required');
  }

  const maskedAcct = maskBankAccount(accountNumber);
  const encryptedAcct = encryptSensitiveValue(accountNumber);
  const cleanIfsc = String(ifscCode).trim().toUpperCase();

  await prisma.helperBankAccount.updateMany({
    where: { userId: helperId },
    data: { isPrimary: false },
  });

  return prisma.helperBankAccount.create({
    data: {
      userId: helperId,
      beneficiaryName: String(beneficiaryName).trim(),
      accountNumberMasked: maskedAcct,
      accountNumberEncrypted: encryptedAcct,
      ifscCode: cleanIfsc,
      bankName,
      branchName,
      upiIdMasked: upiId || null,
      razorpayLinkedAccountId:
        razorpayLinkedAccountId || `acc_rzp_${helperId.replace(/-/g, '').slice(0, 12)}`,
      verificationStatus,
      isPrimary: true,
    },
  });
}

/**
 * Evaluate all statutory & operational eligibility checks before initiating a helper payout.
 * Checks:
 * 1. Booking (Task) is COMPLETED (never pay out simply because customer paid).
 * 2. Payment is not DISPUTED, CHARGEBACK, or REFUNDED.
 * 3. Helper KYC is VERIFIED (Scenario 14).
 * 4. Helper has a verified primary Bank Account / Linked Route Account.
 */
export async function evaluateHelperPayoutEligibility({ taskId, paymentId, helperId }) {
  const [task, payment, helper, bankAccount] = await Promise.all([
    prisma.task.findUnique({ where: { id: taskId } }),
    prisma.payment.findUnique({ where: { id: paymentId } }),
    prisma.user.findUnique({
      where: { id: helperId },
      include: { helperTaxProfile: true },
    }),
    prisma.helperBankAccount.findFirst({
      where: { userId: helperId, isPrimary: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  if (!task) {
    return { eligible: false, eligibilityStatus: 'INVALID_BOOKING', holdReason: 'Booking not found' };
  }
  if (!payment) {
    return { eligible: false, eligibilityStatus: 'INVALID_PAYMENT', holdReason: 'Payment not found' };
  }
  if (task.status !== 'COMPLETED') {
    // Scenario 13 / Section 3 #15: Do not initiate payouts before service completion
    return {
      eligible: false,
      eligibilityStatus: 'PENDING_COMPLETION',
      holdReason: `Service booking status is ${task.status}. Payout requires COMPLETED status.`,
    };
  }
  if (['DISPUTED', 'CHARGEBACK', 'REFUNDED', 'FAILED'].includes(payment.status)) {
    // Scenario 12 / 22
    return {
      eligible: false,
      eligibilityStatus: 'HELD_DISPUTE',
      holdReason: `Payment status is ${payment.status}. Payout frozen pending resolution.`,
    };
  }
  if (!helper || helper.isBlocked) {
    return {
      eligible: false,
      eligibilityStatus: 'HELD_ACCOUNT_BLOCKED',
      holdReason: 'Helper account is blocked or inactive.',
    };
  }
  if (helper.idVerificationStatus !== 'VERIFIED') {
    // Scenario 14: Helper is eligible by completion but has incomplete KYC
    return {
      eligible: false,
      eligibilityStatus: 'HELD_KYC_INCOMPLETE',
      holdReason: `Helper KYC status is ${helper.idVerificationStatus}. Complete government ID verification to unlock payout.`,
    };
  }
  if (!bankAccount || bankAccount.verificationStatus !== 'VERIFIED') {
    return {
      eligible: false,
      eligibilityStatus: 'HELD_BANK_UNVERIFIED',
      holdReason: 'Verified helper bank account is required for Route settlement.',
    };
  }

  return {
    eligible: true,
    eligibilityStatus: 'ELIGIBLE',
    holdReason: null,
    task,
    payment,
    helper,
    bankAccount,
  };
}

/**
 * Initiate or Release Helper Payout for a completed booking.
 * - Prevents duplicate payouts (Test #17).
 * - Deducts any open post-payout RefundAdjustments (Scenario 21).
 * - Releases Razorpay Route transfer hold or creates transfer.
 * - Posts immutable double-entry settlement journal.
 */
export async function processHelperPayoutForBooking({
  paymentId,
  taskId,
  approvedByAdminId = null,
  simulateGatewayFailure = false,
  idempotencyKey = null,
}) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { task: true },
  });

  if (!payment) {
    throw new Error('Payment record not found');
  }

  const resolvedTaskId = taskId || payment.taskId;
  const helperId = payment.payeeId || payment.task?.assignedToId;
  if (!helperId) {
    throw new Error('No helper assigned to this booking payment');
  }

  // 1. Prevent duplicate payout (Test #17)
  const existingPayout = await prisma.helperPayout.findFirst({
    where: { paymentId: payment.id },
  });

  if (existingPayout && existingPayout.status === 'SETTLED') {
    const duplicateError = new Error(
      `DUPLICATE_PAYOUT_PREVENTED: Payout ${existingPayout.id} is already SETTLED for payment ${payment.id}`
    );
    duplicateError.code = 'DUPLICATE_PAYOUT';
    duplicateError.payout = existingPayout;
    throw duplicateError;
  }

  // 2. Run eligibility checks (KYC, Bank Account, Completion, Dispute)
  const eligibility = await evaluateHelperPayoutEligibility({
    taskId: resolvedTaskId,
    paymentId: payment.id,
    helperId,
  });

  // Check if there are open RefundAdjustment recovery balances for this helper (Scenario 21)
  const openRecoveries = await prisma.refundAdjustment.findMany({
    where: { helperId, status: { in: ['OPEN', 'PARTIALLY_RECOVERED'] } },
    orderBy: { createdAt: 'asc' },
  });

  const baseNetEarningsPaise = assertIntegerPaise(
    payment.netHelperEarningsPaise || payment.amount,
    'netHelperEarningsPaise'
  );

  let recoveryDeductedPaise = 0;
  let remainingPayoutCapacity = baseNetEarningsPaise;
  const recoveryUpdates = [];

  for (const adj of openRecoveries) {
    if (remainingPayoutCapacity <= 0) break;
    const deduct = Math.min(remainingPayoutCapacity, adj.remainingPaise);
    if (deduct > 0) {
      recoveryDeductedPaise += deduct;
      remainingPayoutCapacity -= deduct;
      recoveryUpdates.push({
        id: adj.id,
        newRecovered: adj.recoveredPaise + deduct,
        newRemaining: adj.remainingPaise - deduct,
        deductedNow: deduct,
      });
    }
  }

  const finalNetPayoutPaise = Math.max(0, baseNetEarningsPaise - recoveryDeductedPaise);
  const resolvedIdempotencyKey = idempotencyKey || `payout_${payment.id}`;

  // If not yet eligible (e.g., Scenario 14 incomplete KYC or booking not completed), record held payout
  if (!eligibility.eligible) {
    const heldPayout = existingPayout
      ? await prisma.helperPayout.update({
          where: { id: existingPayout.id },
          data: {
            eligibilityStatus: eligibility.eligibilityStatus,
            holdReason: eligibility.holdReason,
            status: 'ON_HOLD',
          },
        })
      : await prisma.helperPayout.create({
          data: {
            helperId,
            taskId: resolvedTaskId,
            paymentId: payment.id,
            idempotencyKey: resolvedIdempotencyKey,
            grossServiceValuePaise: payment.baseServicePaise || payment.amount,
            commissionDeductedPaise: payment.commissionPaise || 0,
            gstOnCommissionPaise: payment.gstOnCommissionPaise || 0,
            tcsDeductedPaise: payment.tcsPaise || 0,
            tdsDeductedPaise: payment.tdsPaise || 0,
            helperDiscountPaise: payment.helperDiscountPaise || 0,
            refundAdjustmentPaise: recoveryDeductedPaise,
            netPayoutPaise: finalNetPayoutPaise,
            eligibilityStatus: eligibility.eligibilityStatus,
            holdReason: eligibility.holdReason,
            status: 'ON_HOLD',
            gatewayTransferId: payment.gatewayTransferId,
          },
        });

    return {
      success: false,
      eligible: false,
      eligibilityStatus: eligibility.eligibilityStatus,
      holdReason: eligibility.holdReason,
      payout: heldPayout,
    };
  }

  // 3. Eligible for Payout -> Execute via PaymentGateway (Razorpay Route)
  const gateway = getPaymentGateway(payment.provider);
  let payoutRecord =
    existingPayout ||
    (await prisma.helperPayout.create({
      data: {
        helperId,
        taskId: resolvedTaskId,
        paymentId: payment.id,
        idempotencyKey: resolvedIdempotencyKey,
        grossServiceValuePaise: payment.baseServicePaise || payment.amount,
        commissionDeductedPaise: payment.commissionPaise || 0,
        gstOnCommissionPaise: payment.gstOnCommissionPaise || 0,
        tcsDeductedPaise: payment.tcsPaise || 0,
        tdsDeductedPaise: payment.tdsPaise || 0,
        helperDiscountPaise: payment.helperDiscountPaise || 0,
        refundAdjustmentPaise: recoveryDeductedPaise,
        netPayoutPaise: finalNetPayoutPaise,
        eligibilityStatus: approvedByAdminId ? 'APPROVED' : 'ELIGIBLE',
        holdReason: null,
        status: 'PROCESSING',
        approvedByAdminId,
        approvedAt: approvedByAdminId ? new Date() : null,
        initiatedAt: new Date(),
      },
    }));

  const attemptCount = await prisma.payoutAttempt.count({
    where: { payoutId: payoutRecord.id },
  });
  const attemptIdempotencyKey = `${resolvedIdempotencyKey}_attempt_${attemptCount + 1}`;

  // Scenario 20 / Test #16: Simulated or real gateway payout failure
  if (simulateGatewayFailure) {
    await prisma.payoutAttempt.create({
      data: {
        payoutId: payoutRecord.id,
        idempotencyKey: attemptIdempotencyKey,
        attemptNumber: attemptCount + 1,
        amountPaise: finalNetPayoutPaise,
        status: 'FAILED',
        failureReason: 'BANK_BENEFICIARY_TIMEOUT: Simulated gateway transfer failure',
      },
    });

    payoutRecord = await prisma.helperPayout.update({
      where: { id: payoutRecord.id },
      data: {
        status: 'FAILED',
        holdReason: 'BANK_BENEFICIARY_TIMEOUT: Simulated gateway transfer failure',
      },
    });

    return {
      success: false,
      eligible: true,
      status: 'FAILED',
      payout: payoutRecord,
    };
  }

  let transferResult;
  if (payment.gatewayTransferId && recoveryDeductedPaise === 0) {
    transferResult = await gateway.releaseTransferHold(payment.gatewayTransferId);
  } else if (finalNetPayoutPaise > 0) {
    transferResult = await gateway.initiateTransfer({
      gatewayPaymentId: payment.razorpayPaymentId,
      linkedAccountId: eligibility.bankAccount.razorpayLinkedAccountId,
      amountPaise: finalNetPayoutPaise,
      onHold: false,
      idempotencyKey: attemptIdempotencyKey,
      notes: {
        taskId: resolvedTaskId,
        paymentId: payment.id,
        helperId,
      },
    });
  } else {
    transferResult = {
      transferId: `trf_offset_${Date.now()}`,
      status: 'processed',
      utrNumber: `OFFSET_${Date.now()}`,
    };
  }

  // 4. Commit settlement, recovery deductions, and double-entry ledger journal in a transaction
  const settledResult = await prisma.$transaction(async (tx) => {
    await tx.payoutAttempt.create({
      data: {
        payoutId: payoutRecord.id,
        idempotencyKey: attemptIdempotencyKey,
        attemptNumber: attemptCount + 1,
        amountPaise: finalNetPayoutPaise,
        gatewayTransferId: transferResult.transferId,
        status: 'PROCESSED',
        rawResponse: transferResult.raw || transferResult,
      },
    });

    for (const upd of recoveryUpdates) {
      await tx.refundAdjustment.update({
        where: { id: upd.id },
        data: {
          recoveredPaise: upd.newRecovered,
          remainingPaise: upd.newRemaining,
          status: upd.newRemaining === 0 ? 'RECOVERED' : 'PARTIALLY_RECOVERED',
          recoveredInPayoutId: payoutRecord.id,
        },
      });
    }

    const updatedPayout = await tx.helperPayout.update({
      where: { id: payoutRecord.id },
      data: {
        refundAdjustmentPaise: recoveryDeductedPaise,
        netPayoutPaise: finalNetPayoutPaise,
        eligibilityStatus: approvedByAdminId ? 'APPROVED' : 'ELIGIBLE',
        holdReason: null,
        status: 'SETTLED',
        gatewayTransferId: transferResult.transferId,
        utrNumber: transferResult.utrNumber || `UTR${Date.now()}`,
        settledAt: new Date(),
      },
    });

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'SETTLED',
        gatewayTransferId: transferResult.transferId,
        transferHoldStatus: 'RELEASED',
        completedAt: payment.completedAt || new Date(),
      },
    });

    await tx.task.update({
      where: { id: resolvedTaskId },
      data: { paymentStatus: 'SETTLED' },
    });

    // Double-entry ledger journal for Payout Settlement
    const journalLines = [];
    if (baseNetEarningsPaise > 0) {
      journalLines.push({
        accountCode: '2001_HELPER_PAYABLE',
        debitPaise: baseNetEarningsPaise,
        creditPaise: 0,
        helperId,
        gatewayReference: transferResult.transferId,
      });
    }
    if (finalNetPayoutPaise > 0) {
      journalLines.push({
        accountCode: '1001_CUSTOMER_PAYMENT_CLEARING',
        debitPaise: 0,
        creditPaise: finalNetPayoutPaise,
        helperId,
        gatewayReference: transferResult.transferId,
      });
    }
    if (recoveryDeductedPaise > 0) {
      journalLines.push({
        accountCode: '1004_HELPER_RECOVERY_RECEIVABLE',
        debitPaise: 0,
        creditPaise: recoveryDeductedPaise,
        helperId,
        gatewayReference: transferResult.transferId,
      });
    }

    if (journalLines.length >= 2) {
      await postJournalEntry(
        {
          eventType: 'PAYOUT_SETTLED',
          bookingId: resolvedTaskId,
          paymentId: payment.id,
          description: `Helper Route payout settled (${transferResult.transferId}) — Net Paid: ₹${(
            finalNetPayoutPaise / 100
          ).toFixed(2)}`,
          lines: journalLines,
        },
        tx
      );
    }

    return updatedPayout;
  });

  return {
    success: true,
    eligible: true,
    status: 'SETTLED',
    payout: settledResult,
  };
}

/**
 * Reverse a previously settled or processing payout (Scenario 20)
 */
export async function reverseHelperPayout(payoutId, reason = 'Payout reversed by gateway') {
  const payout = await prisma.helperPayout.findUnique({
    where: { id: payoutId },
  });
  if (!payout) throw new Error('Payout not found');

  const gateway = getPaymentGateway(payout.gatewayProvider);
  if (payout.gatewayTransferId && payout.netPayoutPaise > 0) {
    await gateway.reverseTransfer({
      gatewayTransferId: payout.gatewayTransferId,
      amountPaise: payout.netPayoutPaise,
    });
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.helperPayout.update({
      where: { id: payoutId },
      data: {
        status: 'REVERSED',
        holdReason: reason,
      },
    });

    if (payout.netPayoutPaise > 0) {
      await postJournalEntry(
        {
          eventType: 'REVERSAL',
          bookingId: payout.taskId,
          paymentId: payout.paymentId,
          description: `Helper payout reversed (${payout.id}): ${reason}`,
          lines: [
            {
              accountCode: '1001_CUSTOMER_PAYMENT_CLEARING',
              debitPaise: payout.netPayoutPaise,
              creditPaise: 0,
              helperId: payout.helperId,
            },
            {
              accountCode: '2001_HELPER_PAYABLE',
              debitPaise: 0,
              creditPaise: payout.netPayoutPaise,
              helperId: payout.helperId,
            },
          ],
          isReversal: true,
        },
        tx
      );
    }

    return updated;
  });
}

/**
 * Get complete Helper Earnings & Accounting Ledger Summary (Section 8)
 */
export async function getHelperEarningsLedger(helperId) {
  const [helper, payouts, payments, withholdings, recoveryAdjustments, ledgerEntries] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: helperId },
        include: {
          helperTaxProfile: true,
          helperBankAccounts: { where: { isPrimary: true } },
        },
      }),
      prisma.helperPayout.findMany({
        where: { helperId },
        include: {
          task: { select: { id: true, title: true, category: true, status: true } },
          attempts: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.findMany({
        where: { payeeId: helperId },
        include: {
          task: { select: { id: true, title: true, category: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.taxWithholding.findMany({
        where: { helperId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.refundAdjustment.findMany({
        where: { helperId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.ledgerEntry.findMany({
        where: { helperId },
        include: { journal: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

  const totalGrossEarningsPaise = payments
    .filter((p) => !['FAILED', 'PENDING', 'INITIATED'].includes(p.status))
    .reduce((sum, p) => sum + Number(p.baseServicePaise || p.amount || 0), 0);

  const commissionDeductedPaise = payments
    .filter((p) => !['FAILED', 'PENDING', 'INITIATED'].includes(p.status))
    .reduce((sum, p) => sum + Number(p.commissionPaise || 0), 0);

  const gstDeductedPaise = payments
    .filter((p) => !['FAILED', 'PENDING', 'INITIATED'].includes(p.status))
    .reduce((sum, p) => sum + Number(p.tcsPaise || 0), 0);

  const tdsDeductedPaise = payments
    .filter((p) => !['FAILED', 'PENDING', 'INITIATED'].includes(p.status))
    .reduce((sum, p) => sum + Number(p.tdsPaise || 0), 0);

  const paidAmountPaise = payouts
    .filter((p) => p.status === 'SETTLED')
    .reduce((sum, p) => sum + Number(p.netPayoutPaise || 0), 0);

  const pendingEarningsPaise = payouts
    .filter((p) => ['PENDING', 'ON_HOLD', 'PROCESSING'].includes(p.status))
    .reduce((sum, p) => sum + Number(p.netPayoutPaise || 0), 0);

  const availableEligiblePaise = payouts
    .filter((p) => p.status === 'ON_HOLD' && p.eligibilityStatus === 'ELIGIBLE')
    .reduce((sum, p) => sum + Number(p.netPayoutPaise || 0), 0);

  const failedPayoutsPaise = payouts
    .filter((p) => p.status === 'FAILED')
    .reduce((sum, p) => sum + Number(p.netPayoutPaise || 0), 0);

  const openRefundAdjustmentsPaise = recoveryAdjustments
    .filter((r) => r.status !== 'RECOVERED')
    .reduce((sum, r) => sum + Number(r.remainingPaise || 0), 0);

  return {
    helperId,
    kycStatus: helper?.idVerificationStatus || 'UNVERIFIED',
    taxProfile: helper?.helperTaxProfile || null,
    primaryBankAccount: helper?.helperBankAccounts?.[0] || null,
    summaryPaise: {
      totalGrossEarningsPaise,
      pendingEarningsPaise,
      availableBalancePaise: availableEligiblePaise,
      paidAmountPaise,
      commissionDeductedPaise,
      gstTcsDeductedPaise: gstDeductedPaise,
      incomeTaxTdsDeductedPaise: tdsDeductedPaise,
      refundAdjustmentsPaise: openRefundAdjustmentsPaise,
      failedPayoutsPaise,
    },
    summaryRupees: {
      totalGrossEarnings: Number((totalGrossEarningsPaise / 100).toFixed(2)),
      pendingEarnings: Number((pendingEarningsPaise / 100).toFixed(2)),
      availableBalance: Number((availableEligiblePaise / 100).toFixed(2)),
      paidAmount: Number((paidAmountPaise / 100).toFixed(2)),
      commissionDeducted: Number((commissionDeductedPaise / 100).toFixed(2)),
      gstTcsDeducted: Number((gstDeductedPaise / 100).toFixed(2)),
      incomeTaxTdsDeducted: Number((tdsDeductedPaise / 100).toFixed(2)),
      refundAdjustments: Number((openRefundAdjustmentsPaise / 100).toFixed(2)),
      failedPayouts: Number((failedPayoutsPaise / 100).toFixed(2)),
    },
    payoutHistory: payouts,
    transactionHistory: payments,
    tdsWithholdings: withholdings,
    refundAdjustments: recoveryAdjustments,
    ledgerEntries,
  };
}
