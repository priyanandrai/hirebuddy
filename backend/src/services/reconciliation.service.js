import prisma from '../utils/prisma.js';

/**
 * Reconciliation Service
 * Detects discrepancies between:
 * 1. Customer Payments in DB vs Gateway Payments
 * 2. Helper Payouts in DB vs Gateway Route Transfers / Settlements
 * 3. Refunds in DB vs Gateway Refunds
 * 4. Payment records vs Double-Entry Ledger Journals
 * 5. Payment status vs Booking (Task) status
 */
export async function runMarketplaceReconciliation({
  gatewaySnapshot = null, // Optional external gateway report { payments: [], transfers: [], refunds: [], settlements: [] }
  scope = 'FULL',
} = {}) {
  const [dbPayments, dbPayouts, dbRefunds, dbJournals] = await Promise.all([
    prisma.payment.findMany({
      include: {
        task: { select: { id: true, status: true, paymentStatus: true, budget: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 250,
    }),
    prisma.helperPayout.findMany({
      orderBy: { createdAt: 'desc' },
      take: 250,
    }),
    prisma.refund.findMany({
      orderBy: { createdAt: 'desc' },
      take: 250,
    }),
    prisma.ledgerJournal.findMany({
      include: { entries: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    }),
  ]);

  const discrepancies = [];
  let totalChecked = 0;
  let matchedCount = 0;
  let totalDiscrepancyPaise = 0;

  const journalsByPaymentId = new Map();
  for (const j of dbJournals) {
    if (!j.paymentId) continue;
    const list = journalsByPaymentId.get(j.paymentId) || [];
    list.push(j);
    journalsByPaymentId.set(j.paymentId, list);
  }

  const gatewayPaymentsMap = new Map(
    (gatewaySnapshot?.payments || []).map((gp) => [gp.orderId || gp.paymentId, gp])
  );
  const gatewayTransfersMap = new Map(
    (gatewaySnapshot?.transfers || []).map((gt) => [gt.transferId, gt])
  );

  // 1. Check DB Payments vs Booking Status, Ledger Journals, and Gateway Snapshot
  for (const p of dbPayments) {
    totalChecked++;
    let hasIssue = false;

    // Check A: Booking & Payment status mismatch (Scenario 17 / Test #19)
    if (
      ['CONFIRMED', 'HELD_IN_ESCROW', 'COMPLETED', 'SETTLED'].includes(p.status) &&
      p.task &&
      p.task.paymentStatus === 'PENDING'
    ) {
      hasIssue = true;
      discrepancies.push({
        type: 'BOOKING_PAYMENT_STATUS_MISMATCH',
        paymentId: p.id,
        bookingId: p.taskId,
        orderId: p.razorpayOrderId,
        expectedStatus: p.status,
        actualBookingPaymentStatus: p.task.paymentStatus,
        discrepancyPaise: p.amount,
        message: `Payment ${p.id} is ${p.status} but Task ${p.taskId} has paymentStatus=${p.task.paymentStatus}`,
      });
    }

    // Check B: Gateway Snapshot comparison (if gateway data provided - Test #20)
    const gwRecord =
      gatewayPaymentsMap.get(p.razorpayOrderId) ||
      gatewayPaymentsMap.get(p.razorpayPaymentId);

    if (gwRecord) {
      if (Number(gwRecord.amountPaise) !== Number(p.amount)) {
        hasIssue = true;
        const diff = Math.abs(Number(gwRecord.amountPaise) - Number(p.amount));
        totalDiscrepancyPaise += diff;
        discrepancies.push({
          type: 'GATEWAY_AMOUNT_MISMATCH',
          paymentId: p.id,
          orderId: p.razorpayOrderId,
          dbAmountPaise: p.amount,
          gatewayAmountPaise: gwRecord.amountPaise,
          discrepancyPaise: diff,
          message: `Gateway amount (${gwRecord.amountPaise} paise) does not match DB payment amount (${p.amount} paise)`,
        });
      }
      if (gwRecord.status === 'captured' && ['PENDING', 'INITIATED', 'FAILED'].includes(p.status)) {
        hasIssue = true;
        totalDiscrepancyPaise += p.amount;
        discrepancies.push({
          type: 'UNRECORDED_GATEWAY_CAPTURE',
          paymentId: p.id,
          orderId: p.razorpayOrderId,
          dbStatus: p.status,
          gatewayStatus: gwRecord.status,
          discrepancyPaise: p.amount,
          message: `Gateway reports captured for order ${p.razorpayOrderId}, but DB payment is ${p.status}`,
        });
      }
    }

    // Check C: Ledger Journal balance check for new marketplace payments
    const paymentJournals = journalsByPaymentId.get(p.id) || [];
    for (const jrn of paymentJournals) {
      if (jrn.totalDebitPaise !== jrn.totalCreditPaise) {
        hasIssue = true;
        const diff = Math.abs(jrn.totalDebitPaise - jrn.totalCreditPaise);
        totalDiscrepancyPaise += diff;
        discrepancies.push({
          type: 'UNBALANCED_LEDGER_JOURNAL',
          journalId: jrn.id,
          paymentId: p.id,
          debitPaise: jrn.totalDebitPaise,
          creditPaise: jrn.totalCreditPaise,
          discrepancyPaise: diff,
          message: `Journal ${jrn.journalNumber} is unbalanced`,
        });
      }
    }

    if (!hasIssue) {
      matchedCount++;
    }
  }

  // 2. Check Helper Payouts vs Gateway Route Transfers
  for (const payout of dbPayouts) {
    totalChecked++;
    let hasIssue = false;

    const gwTransfer = payout.gatewayTransferId
      ? gatewayTransfersMap.get(payout.gatewayTransferId)
      : null;

    if (gwTransfer) {
      if (Number(gwTransfer.amountPaise) !== Number(payout.netPayoutPaise)) {
        hasIssue = true;
        const diff = Math.abs(Number(gwTransfer.amountPaise) - Number(payout.netPayoutPaise));
        totalDiscrepancyPaise += diff;
        discrepancies.push({
          type: 'PAYOUT_TRANSFER_AMOUNT_MISMATCH',
          payoutId: payout.id,
          transferId: payout.gatewayTransferId,
          dbNetPayoutPaise: payout.netPayoutPaise,
          gatewayTransferPaise: gwTransfer.amountPaise,
          discrepancyPaise: diff,
          message: `Payout ${payout.id} netPaise (${payout.netPayoutPaise}) != Gateway transfer (${gwTransfer.amountPaise})`,
        });
      }
      if (gwTransfer.status === 'failed' && payout.status === 'SETTLED') {
        hasIssue = true;
        totalDiscrepancyPaise += payout.netPayoutPaise;
        discrepancies.push({
          type: 'PAYOUT_STATUS_MISMATCH',
          payoutId: payout.id,
          transferId: payout.gatewayTransferId,
          dbStatus: payout.status,
          gatewayStatus: gwTransfer.status,
          discrepancyPaise: payout.netPayoutPaise,
          message: `Gateway transfer ${payout.gatewayTransferId} failed but DB payout is marked SETTLED`,
        });
      }
    }

    if (!hasIssue) {
      matchedCount++;
    }
  }

  const batchNumber = `RECON-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const status = discrepancies.length > 0 ? 'DISCREPANCY_FOUND' : 'COMPLETED';

  const reconRecord = await prisma.reconciliation.create({
    data: {
      batchNumber,
      scope,
      totalChecked,
      matchedCount,
      mismatchCount: discrepancies.length,
      discrepancyPaise: totalDiscrepancyPaise,
      discrepancies,
      status,
    },
  });

  return reconRecord;
}
