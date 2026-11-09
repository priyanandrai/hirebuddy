import prisma from '../utils/prisma.js';
import { assertIntegerPaise } from '../utils/cryptoVault.js';
import { getIndianTaxPeriod } from './tdsWithholdingEngine.service.js';

export const CHART_OF_ACCOUNTS = [
  { code: '1001_CUSTOMER_PAYMENT_CLEARING', name: 'Customer Payment Clearing Account', accountType: 'ASSET', normalSide: 'DEBIT' },
  { code: '1002_GST_INPUT_CREDIT', name: 'GST Input Tax Credit (ITC)', accountType: 'ASSET', normalSide: 'DEBIT' },
  { code: '1003_GATEWAY_GST_ITC', name: 'Gateway Fee GST Input Tax Credit', accountType: 'ASSET', normalSide: 'DEBIT' },
  { code: '1004_HELPER_RECOVERY_RECEIVABLE', name: 'Helper Post-Payout Refund Recovery Receivable', accountType: 'ASSET', normalSide: 'DEBIT' },
  { code: '2001_HELPER_PAYABLE', name: 'Helper Earnings Payable Account', accountType: 'LIABILITY', normalSide: 'CREDIT' },
  { code: '2002_GST_OUTPUT_PAYABLE', name: 'GST Output Liability Payable', accountType: 'LIABILITY', normalSide: 'CREDIT' },
  { code: '2003_GST_TCS_PAYABLE', name: 'GST Section 52 TCS Payable', accountType: 'LIABILITY', normalSide: 'CREDIT' },
  { code: '2004_INCOME_TAX_TDS_PAYABLE', name: 'Income-Tax Section 194-O TDS Payable', accountType: 'LIABILITY', normalSide: 'CREDIT' },
  { code: '2005_REFUND_LIABILITY', name: 'Customer Refund Liability Account', accountType: 'LIABILITY', normalSide: 'CREDIT' },
  { code: '2006_CHARGEBACK_LIABILITY', name: 'Gateway Chargeback & Dispute Liability', accountType: 'LIABILITY', normalSide: 'CREDIT' },
  { code: '2007_PAYOUT_CLEARING', name: 'Helper Payout Settlement Clearing Account', accountType: 'LIABILITY', normalSide: 'CREDIT' },
  { code: '4001_PLATFORM_COMMISSION_REVENUE', name: 'HireBuddy Platform Commission Revenue', accountType: 'REVENUE', normalSide: 'CREDIT' },
  { code: '4002_PRINCIPAL_SERVICE_REVENUE', name: 'HireBuddy Principal Service Supply Revenue', accountType: 'REVENUE', normalSide: 'CREDIT' },
  { code: '5001_GATEWAY_FEE_EXPENSE', name: 'Payment Gateway Processing Fee Expense', accountType: 'EXPENSE', normalSide: 'DEBIT' },
  { code: '5002_PROMO_DISCOUNT_EXPENSE', name: 'Platform Promotional Discount Expense', accountType: 'EXPENSE', normalSide: 'DEBIT' },
  { code: '5003_HELPER_VENDOR_EXPENSE', name: 'Principal Model Helper Service Expense', accountType: 'EXPENSE', normalSide: 'DEBIT' },
];

/**
 * Ensure all Chart of Accounts records exist in MariaDB
 */
export async function ensureChartOfAccounts(tx = prisma) {
  const existing = await tx.financialAccount.findMany();
  const existingMap = new Map(existing.map((a) => [a.code, a]));

  for (const acct of CHART_OF_ACCOUNTS) {
    if (!existingMap.has(acct.code)) {
      const created = await tx.financialAccount.create({ data: acct });
      existingMap.set(acct.code, created);
    }
  }
  return existingMap;
}

/**
 * Post an immutable, balanced double-entry journal to the financial ledger.
 * Throws if total debits !== total credits or if any entry has negative paise.
 */
export async function postJournalEntry(
  {
    eventType,
    bookingId = null,
    paymentId = null,
    description,
    lines = [],
    taxPeriod = null,
    isReversal = false,
    reversedJournalId = null,
  },
  externalTx = null
) {
  const validLines = lines.filter(
    (l) => (Number(l.debitPaise || 0) > 0 || Number(l.creditPaise || 0) > 0)
  );

  if (validLines.length < 2) {
    throw new Error('Double-entry journal requires at least two non-zero ledger lines');
  }

  let totalDebitPaise = 0;
  let totalCreditPaise = 0;

  for (const line of validLines) {
    const debit = assertIntegerPaise(line.debitPaise || 0, `debitPaise (${line.accountCode})`);
    const credit = assertIntegerPaise(line.creditPaise || 0, `creditPaise (${line.accountCode})`);
    if (debit > 0 && credit > 0) {
      throw new Error(`Ledger line for ${line.accountCode} cannot have both debit and credit > 0`);
    }
    totalDebitPaise += debit;
    totalCreditPaise += credit;
  }

  if (totalDebitPaise !== totalCreditPaise) {
    throw new Error(
      `Unbalanced double-entry journal (${eventType}): totalDebitPaise=${totalDebitPaise} !== totalCreditPaise=${totalCreditPaise}`
    );
  }

  const resolvedPeriod = taxPeriod || getIndianTaxPeriod(new Date()).taxPeriod;
  const journalNumber = `JRN-${resolvedPeriod.replace('-', '')}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;

  const executeInTx = async (tx) => {
    const accountMap = await ensureChartOfAccounts(tx);

    const journal = await tx.ledgerJournal.create({
      data: {
        journalNumber,
        eventType,
        bookingId,
        paymentId,
        description,
        totalDebitPaise,
        totalCreditPaise,
        currency: 'INR',
        taxPeriod: resolvedPeriod,
        isReversal: Boolean(isReversal),
        reversedJournalId,
      },
    });

    const createdEntries = [];
    for (const line of validLines) {
      const account = accountMap.get(line.accountCode);
      if (!account) {
        throw new Error(`Unknown financial account code: ${line.accountCode}`);
      }

      const debit = Number(line.debitPaise || 0);
      const credit = Number(line.creditPaise || 0);

      // Update running account balance according to normalSide
      const delta =
        account.normalSide === 'DEBIT'
          ? BigInt(debit - credit)
          : BigInt(credit - debit);

      await tx.financialAccount.update({
        where: { id: account.id },
        data: { balancePaise: { increment: delta } },
      });

      const entry = await tx.ledgerEntry.create({
        data: {
          journalId: journal.id,
          accountId: account.id,
          accountCode: account.code,
          bookingId: line.bookingId ?? bookingId,
          paymentId: line.paymentId ?? paymentId,
          helperId: line.helperId || null,
          customerId: line.customerId || null,
          gatewayReference: line.gatewayReference || null,
          debitPaise: debit,
          creditPaise: credit,
          currency: 'INR',
          taxPeriod: resolvedPeriod,
          reconciliationStatus: line.reconciliationStatus || 'UNRECONCILED',
        },
      });
      createdEntries.push(entry);
    }

    return { ...journal, entries: createdEntries };
  };

  if (externalTx) {
    return executeInTx(externalTx);
  }
  return prisma.$transaction(executeInTx);
}

/**
 * Create an immutable contra-journal reversing a previously posted journal.
 * Never modifies or deletes original journal entries.
 */
export async function reverseJournalEntry(originalJournalId, reason = 'Reversal entry', externalTx = null) {
  const original = await (externalTx || prisma).ledgerJournal.findUnique({
    where: { id: originalJournalId },
    include: { entries: true },
  });

  if (!original) {
    throw new Error(`Original journal ${originalJournalId} not found`);
  }

  const reversedLines = original.entries.map((entry) => ({
    accountCode: entry.accountCode,
    bookingId: entry.bookingId,
    paymentId: entry.paymentId,
    helperId: entry.helperId,
    customerId: entry.customerId,
    gatewayReference: entry.gatewayReference,
    debitPaise: entry.creditPaise, // Swap debit & credit
    creditPaise: entry.debitPaise,
  }));

  return postJournalEntry(
    {
      eventType: 'REVERSAL',
      bookingId: original.bookingId,
      paymentId: original.paymentId,
      description: `Reversal of ${original.journalNumber}: ${reason}`,
      lines: reversedLines,
      taxPeriod: original.taxPeriod,
      isReversal: true,
      reversedJournalId: original.id,
    },
    externalTx
  );
}

/**
 * Guardrail: explicitly block direct modification or deletion of completed ledger entries.
 */
export function modifyLedgerEntry() {
  throw new Error(
    'IMMUTABLE_LEDGER_VIOLATION: Completed financial ledger entries cannot be modified or deleted. Post a reversal/adjustment journal instead.'
  );
}

/**
 * Post balanced double-entry journal when a Customer Payment is captured & verified.
 * Distinguishes between:
 * - Customer payment collection (Clearing Asset)
 * - Platform Commission Revenue (4001) vs Principal Service Revenue (4002)
 * - Helper Payable (2001)
 * - GST Output Payable (2002)
 * - GST Section 52 TCS Payable (2003)
 * - Income-Tax Section 194-O TDS Payable (2004)
 * - Platform Promotional Discount Expense (5002)
 * - Gateway Fee Expense (5001) & Gateway GST Input Credit (1003)
 */
export async function recordPaymentCapturedJournal(
  {
    bookingId,
    paymentId,
    customerId,
    helperId,
    gatewayPaymentId,
    breakdown,
  },
  externalTx = null
) {
  const totalCustomerPaid = breakdown.totalCustomerPayablePaise;
  const platformDiscount = breakdown.platformDiscountPaise || 0;
  const netHelperPayable = breakdown.netHelperPayablePaise;
  const tcsPaise = breakdown.tcsPaise || 0;
  const tdsPaise = breakdown.tdsPaise || 0;
  const gstOnService = breakdown.gstOnServicePaise || 0;
  const gstOnCommission = breakdown.gstOnCommissionPaise || 0;
  const commissionPaise = breakdown.commissionPaise || 0;
  const gatewayFee = breakdown.gatewayFeePaise || 0;
  const gatewayGst = breakdown.gatewayGstPaise || 0;

  // Determine exact revenue & GST output credit lines so debits === credits to the exact paise
  const totalDebitsSide = totalCustomerPaid + platformDiscount;
  const nonRevenueCredits = netHelperPayable + tcsPaise + tdsPaise;

  // Total GST output recorded by platform (Sec 9(5) or Principal service GST + Commission GST)
  const platformGstOutput =
    breakdown.supplyClassification === 'ORDINARY_MARKETPLACE'
      ? gstOnCommission
      : gstOnService + gstOnCommission;

  // Remaining credit is platform commission/service revenue
  const platformRevenueCredit = Math.max(
    0,
    totalDebitsSide - nonRevenueCredits - platformGstOutput
  );

  const lines = [
    // Debit 1: Customer Payment Clearing (gross cash/gateway receivable from customer)
    {
      accountCode: '1001_CUSTOMER_PAYMENT_CLEARING',
      debitPaise: totalCustomerPaid,
      creditPaise: 0,
      customerId,
      gatewayReference: gatewayPaymentId,
    },
  ];

  // Debit 2: Platform-funded promotional discount expense (if any)
  if (platformDiscount > 0) {
    lines.push({
      accountCode: '5002_PROMO_DISCOUNT_EXPENSE',
      debitPaise: platformDiscount,
      creditPaise: 0,
      customerId,
    });
  }

  // Credit 1: Helper Payable (net amount payable to helper upon completion)
  if (netHelperPayable > 0) {
    lines.push({
      accountCode: '2001_HELPER_PAYABLE',
      debitPaise: 0,
      creditPaise: netHelperPayable,
      helperId,
      gatewayReference: gatewayPaymentId,
    });
  }

  // Credit 2: Platform Commission Revenue (or Principal Service Revenue)
  if (platformRevenueCredit > 0) {
    lines.push({
      accountCode:
        breakdown.supplyClassification === 'PRINCIPAL_PROVIDER'
          ? '4002_PRINCIPAL_SERVICE_REVENUE'
          : '4001_PLATFORM_COMMISSION_REVENUE',
      debitPaise: 0,
      creditPaise: platformRevenueCredit,
      helperId,
      customerId,
    });
  }

  // Credit 3: GST Output Payable
  if (platformGstOutput > 0) {
    lines.push({
      accountCode: '2002_GST_OUTPUT_PAYABLE',
      debitPaise: 0,
      creditPaise: platformGstOutput,
      helperId,
      customerId,
    });
  }

  // Credit 4: Section 52 GST TCS Payable (Statutory collection — never platform revenue)
  if (tcsPaise > 0) {
    lines.push({
      accountCode: '2003_GST_TCS_PAYABLE',
      debitPaise: 0,
      creditPaise: tcsPaise,
      helperId,
    });
  }

  // Credit 5: Section 194-O Income-Tax TDS Payable
  if (tdsPaise > 0) {
    lines.push({
      accountCode: '2004_INCOME_TAX_TDS_PAYABLE',
      debitPaise: 0,
      creditPaise: tdsPaise,
      helperId,
    });
  }

  // Separate balanced pair for Gateway Processing Fee & Gateway GST ITC (Scenario 26)
  if (gatewayFee > 0 || gatewayGst > 0) {
    lines.push(
      {
        accountCode: '5001_GATEWAY_FEE_EXPENSE',
        debitPaise: gatewayFee,
        creditPaise: 0,
        gatewayReference: gatewayPaymentId,
      },
      {
        accountCode: '1003_GATEWAY_GST_ITC',
        debitPaise: gatewayGst,
        creditPaise: 0,
        gatewayReference: gatewayPaymentId,
      },
      {
        accountCode: '1001_CUSTOMER_PAYMENT_CLEARING',
        debitPaise: 0,
        creditPaise: gatewayFee + gatewayGst,
        gatewayReference: gatewayPaymentId,
      }
    );
  }

  return postJournalEntry(
    {
      eventType: 'PAYMENT_CAPTURED',
      bookingId,
      paymentId,
      description: `Booking payment captured (${breakdown.supplyClassification}) — Total: ₹${(
        totalCustomerPaid / 100
      ).toFixed(2)}, Commission: ₹${(commissionPaise / 100).toFixed(2)}, Helper Payable: ₹${(
        netHelperPayable / 100
      ).toFixed(2)}`,
      lines,
    },
    externalTx
  );
}

/**
 * Verify Double-Entry Trial Balance across all Ledger Journals and Ledger Entries
 */
export async function verifyLedgerTrialBalance() {
  const [journals, entries] = await Promise.all([
    prisma.ledgerJournal.findMany(),
    prisma.ledgerEntry.findMany(),
  ]);

  let totalDebitsPaise = 0;
  let totalCreditsPaise = 0;
  for (const e of entries) {
    totalDebitsPaise += Number(e.debitPaise || 0);
    totalCreditsPaise += Number(e.creditPaise || 0);
  }

  const unbalancedJournals = journals.filter(
    (j) => Number(j.totalDebitPaise) !== Number(j.totalCreditPaise)
  );

  const discrepancyPaise = Math.abs(totalDebitsPaise - totalCreditsPaise);

  return {
    isBalanced: discrepancyPaise === 0 && unbalancedJournals.length === 0,
    totalDebitsPaise,
    totalCreditsPaise,
    discrepancyPaise,
    journalsCount: journals.length,
    unbalancedJournalsCount: unbalancedJournals.length,
  };
}

