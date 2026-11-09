import prisma from '../utils/prisma.js';
import { getIndianTaxPeriod } from './tdsWithholdingEngine.service.js';

const PLATFORM_GSTIN = process.env.HIREBUDDY_GSTIN || '09AABCH1234F1Z5';
const PLATFORM_PAN = process.env.HIREBUDDY_PAN || 'AABCH1234F';
const PLATFORM_LEGAL_NAME = 'HireBuddy Marketplace Technologies Pvt. Ltd.';

/**
 * Allocate the next sequential document number within a series & financial year
 * e.g., series="HB/COM", financialYear="2026-27" -> "HB/COM/2026-27/000001"
 */
async function nextSequentialInvoiceNumber(series, financialYear, tx = prisma) {
  const lastDoc = await tx.invoice.findFirst({
    where: { series, financialYear },
    orderBy: { sequenceNumber: 'desc' },
    select: { sequenceNumber: true },
  });
  const sequenceNumber = (lastDoc?.sequenceNumber || 0) + 1;
  const padded = String(sequenceNumber).padStart(6, '0');
  const invoiceNumber = `${series}/${financialYear}/${padded}`;
  return { sequenceNumber, invoiceNumber };
}

/**
 * Generate statutory compliant invoices for a confirmed/captured booking payment.
 *
 * CRITICAL LEGAL COMPLIANCE RULE (Section 14):
 * - Never issue a tax invoice in HireBuddy's name for the underlying service unless the
 *   supply model is SECTION_9_5 or PRINCIPAL_PROVIDER!
 * - For ORDINARY_MARKETPLACE:
 *   1. Issues COMMISSION_TAX_INVOICE (HB/COM) from HireBuddy to the Helper for platform commission.
 *   2. Issues CUSTOMER_SERVICE_INVOICE (HB/SVC) in the Helper's supplier name (Tax Invoice if helper is GST-registered, or Bill of Supply if unregistered).
 * - For SECTION_9_5:
 *   1. Issues SECTION_9_5_TAX_INVOICE (HB/95) by HireBuddy as E-Commerce Operator liable u/s 9(5).
 *   2. Issues COMMISSION_TAX_INVOICE (HB/COM) from HireBuddy to the Helper (if commission > 0).
 * - For PRINCIPAL_PROVIDER:
 *   1. Issues CUSTOMER_SERVICE_INVOICE (HB/SVC) in HireBuddy's name as Principal Supplier.
 */
export async function generateStatutoryInvoicesForPayment(
  {
    payment,
    task,
    customer,
    helper,
    helperTaxProfile = {},
    breakdown,
  },
  externalTx = null
) {
  const tx = externalTx || prisma;
  const { financialYear } = getIndianTaxPeriod(new Date());
  const createdDocs = [];

  const supplyType = breakdown.supplyClassification || payment.supplyType || 'ORDINARY_MARKETPLACE';
  const customerName = customer?.name || 'HireBuddy Customer';
  const helperName = helper?.name || 'Verified Service Partner';

  // 1. Underlying Service Invoice
  if (supplyType === 'SECTION_9_5') {
    const { sequenceNumber, invoiceNumber } = await nextSequentialInvoiceNumber(
      'HB/95',
      financialYear,
      tx
    );
    const sec95Doc = await tx.invoice.create({
      data: {
        invoiceNumber,
        series: 'HB/95',
        sequenceNumber,
        financialYear,
        documentType: 'SECTION_9_5_TAX_INVOICE',
        taskId: task.id,
        paymentId: payment.id,
        issuerEntity: 'HIREBUDDY_PLATFORM',
        issuerName: `${PLATFORM_LEGAL_NAME} (E-Commerce Operator liable u/s 9(5) CGST Act)`,
        issuerGstin: PLATFORM_GSTIN,
        issuerPan: PLATFORM_PAN,
        issuerStateCode: breakdown.supplierStateCode || 'UP',
        recipientName: customerName,
        recipientStateCode: breakdown.placeOfSupplyStateCode || 'UP',
        placeOfSupply: breakdown.placeOfSupplyStateCode || 'UP',
        sacCode: breakdown.sacCode,
        taxableValuePaise: breakdown.customerDiscountedServicePaise,
        cgstRateBps: breakdown.isInterState ? 0 : Math.floor((breakdown.gstBreakdown?.serviceGstRateBps || 0) / 2),
        cgstPaise: breakdown.serviceCgstPaise,
        sgstRateBps: breakdown.isInterState ? 0 : Math.floor((breakdown.gstBreakdown?.serviceGstRateBps || 0) / 2),
        sgstPaise: breakdown.serviceSgstPaise,
        igstRateBps: breakdown.isInterState ? breakdown.gstBreakdown?.serviceGstRateBps || 0 : 0,
        igstPaise: breakdown.serviceIgstPaise,
        totalTaxPaise: breakdown.gstOnServicePaise,
        totalInvoicePaise: breakdown.totalCustomerPayablePaise,
        lineItems: [
          {
            description: `${task.category} — ${task.title} (Notified Supply u/s 9(5))`,
            sacCode: breakdown.sacCode,
            taxablePaise: breakdown.customerDiscountedServicePaise,
            gstPaise: breakdown.gstOnServicePaise,
            totalPaise: breakdown.totalCustomerPayablePaise,
          },
        ],
      },
    });
    createdDocs.push(sec95Doc);
  } else if (supplyType === 'PRINCIPAL_PROVIDER') {
    const { sequenceNumber, invoiceNumber } = await nextSequentialInvoiceNumber(
      'HB/SVC',
      financialYear,
      tx
    );
    const principalDoc = await tx.invoice.create({
      data: {
        invoiceNumber,
        series: 'HB/SVC',
        sequenceNumber,
        financialYear,
        documentType: 'CUSTOMER_SERVICE_INVOICE',
        taskId: task.id,
        paymentId: payment.id,
        issuerEntity: 'HIREBUDDY_PLATFORM',
        issuerName: PLATFORM_LEGAL_NAME,
        issuerGstin: PLATFORM_GSTIN,
        issuerPan: PLATFORM_PAN,
        issuerStateCode: breakdown.supplierStateCode || 'UP',
        recipientName: customerName,
        recipientStateCode: breakdown.placeOfSupplyStateCode || 'UP',
        placeOfSupply: breakdown.placeOfSupplyStateCode || 'UP',
        sacCode: breakdown.sacCode,
        taxableValuePaise: breakdown.customerDiscountedServicePaise,
        cgstPaise: breakdown.serviceCgstPaise,
        sgstPaise: breakdown.serviceSgstPaise,
        igstPaise: breakdown.serviceIgstPaise,
        totalTaxPaise: breakdown.gstOnServicePaise,
        totalInvoicePaise: breakdown.totalCustomerPayablePaise,
      },
    });
    createdDocs.push(principalDoc);
  } else {
    // ORDINARY_MARKETPLACE: Supplier is the independent Helper (NEVER issued in HireBuddy's name as service supplier)
    const { sequenceNumber, invoiceNumber } = await nextSequentialInvoiceNumber(
      'HB/SVC',
      financialYear,
      tx
    );
    const helperServiceDoc = await tx.invoice.create({
      data: {
        invoiceNumber,
        series: 'HB/SVC',
        sequenceNumber,
        financialYear,
        documentType: 'CUSTOMER_SERVICE_INVOICE',
        taskId: task.id,
        paymentId: payment.id,
        issuerEntity: 'HELPER_SUPPLIER',
        issuerName: helperName,
        issuerGstin: helperTaxProfile?.isGstRegistered ? helperTaxProfile.gstin : null,
        issuerPan: helperTaxProfile?.panMasked || null,
        issuerStateCode: breakdown.supplierStateCode || 'UP',
        recipientName: customerName,
        recipientStateCode: breakdown.placeOfSupplyStateCode || 'UP',
        placeOfSupply: breakdown.placeOfSupplyStateCode || 'UP',
        sacCode: breakdown.sacCode,
        taxableValuePaise: breakdown.customerDiscountedServicePaise,
        cgstPaise: breakdown.serviceCgstPaise,
        sgstPaise: breakdown.serviceSgstPaise,
        igstPaise: breakdown.serviceIgstPaise,
        totalTaxPaise: breakdown.gstOnServicePaise,
        totalInvoicePaise: breakdown.totalCustomerPayablePaise,
      },
    });
    createdDocs.push(helperServiceDoc);
  }

  // 2. Commission Tax Invoice from HireBuddy to Helper (when commission > 0)
  if (breakdown.commissionPaise > 0) {
    const { sequenceNumber, invoiceNumber } = await nextSequentialInvoiceNumber(
      'HB/COM',
      financialYear,
      tx
    );
    const commDoc = await tx.invoice.create({
      data: {
        invoiceNumber,
        series: 'HB/COM',
        sequenceNumber,
        financialYear,
        documentType: 'COMMISSION_TAX_INVOICE',
        taskId: task.id,
        paymentId: payment.id,
        issuerEntity: 'HIREBUDDY_PLATFORM',
        issuerName: PLATFORM_LEGAL_NAME,
        issuerGstin: PLATFORM_GSTIN,
        issuerPan: PLATFORM_PAN,
        issuerStateCode: 'UP',
        recipientName: helperName,
        recipientGstin: helperTaxProfile?.gstin || null,
        recipientStateCode: breakdown.supplierStateCode || 'UP',
        placeOfSupply: breakdown.supplierStateCode || 'UP',
        sacCode: '998599',
        taxableValuePaise: breakdown.commissionPaise,
        cgstPaise: breakdown.commissionCgstPaise,
        sgstPaise: breakdown.commissionSgstPaise,
        igstPaise: breakdown.commissionIgstPaise,
        totalTaxPaise: breakdown.gstOnCommissionPaise,
        totalInvoicePaise: breakdown.commissionPaise + breakdown.gstOnCommissionPaise,
      },
    });
    createdDocs.push(commDoc);
  }

  // 3. Helper Payout & Tax Withholding Statement
  const { sequenceNumber: paySeq, invoiceNumber: payNumber } = await nextSequentialInvoiceNumber(
    'HB/PAY',
    financialYear,
    tx
  );
  const statementDoc = await tx.invoice.create({
    data: {
      invoiceNumber: payNumber,
      series: 'HB/PAY',
      sequenceNumber: paySeq,
      financialYear,
      documentType: 'HELPER_PAYOUT_STATEMENT',
      taskId: task.id,
      paymentId: payment.id,
      issuerEntity: 'HIREBUDDY_PLATFORM',
      issuerName: PLATFORM_LEGAL_NAME,
      issuerGstin: PLATFORM_GSTIN,
      issuerPan: PLATFORM_PAN,
      recipientName: helperName,
      recipientGstin: helperTaxProfile?.gstin || null,
      placeOfSupply: breakdown.supplierStateCode || 'UP',
      sacCode: breakdown.sacCode,
      taxableValuePaise: breakdown.effectiveHelperServiceBasePaise,
      totalTaxPaise: breakdown.tcsPaise + breakdown.tdsPaise,
      totalInvoicePaise: breakdown.netHelperPayablePaise,
      lineItems: [
        {
          grossServiceValuePaise: breakdown.effectiveHelperServiceBasePaise,
          commissionDeductedPaise: breakdown.commissionPaise,
          section52TcsDeductedPaise: breakdown.tcsPaise,
          section194OTdsDeductedPaise: breakdown.tdsPaise,
          netHelperPayablePaise: breakdown.netHelperPayablePaise,
        },
      ],
    },
  });
  createdDocs.push(statementDoc);

  return createdDocs;
}

/**
 * Generate a sequential GST Credit Note when a refund is processed
 */
export async function generateCreditNoteForRefund({ payment, refund }, externalTx = null) {
  const tx = externalTx || prisma;
  const { financialYear } = getIndianTaxPeriod(new Date());

  const originalInvoice = await tx.invoice.findFirst({
    where: {
      paymentId: payment.id,
      documentType: { in: ['CUSTOMER_SERVICE_INVOICE', 'SECTION_9_5_TAX_INVOICE'] },
    },
  });

  const { sequenceNumber, invoiceNumber } = await nextSequentialInvoiceNumber(
    'HB/CN',
    financialYear,
    tx
  );

  const taxableReversedPaise = Math.max(
    0,
    refund.refundableCustomerPaise - refund.serviceGstReversedPaise
  );

  return tx.invoice.create({
    data: {
      invoiceNumber,
      series: 'HB/CN',
      sequenceNumber,
      financialYear,
      documentType: 'CREDIT_NOTE',
      taskId: payment.taskId,
      paymentId: payment.id,
      issuerEntity: originalInvoice?.issuerEntity || 'HIREBUDDY_PLATFORM',
      issuerName: originalInvoice?.issuerName || PLATFORM_LEGAL_NAME,
      issuerGstin: originalInvoice?.issuerGstin || PLATFORM_GSTIN,
      recipientName: originalInvoice?.recipientName || 'Customer',
      placeOfSupply: payment.placeOfSupplyState || 'UP',
      sacCode: originalInvoice?.sacCode || null,
      taxableValuePaise: taxableReversedPaise,
      totalTaxPaise: refund.serviceGstReversedPaise,
      totalInvoicePaise: refund.refundableCustomerPaise,
      linkedInvoiceNumber: originalInvoice?.invoiceNumber || null,
    },
  });
}

/**
 * Convert an array of objects into an RFC-4180 CSV string for Admin Tax & Financial Exports
 */
export function toCsvString(rows = []) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escapeCell = (val) => {
    if (val === null || val === undefined) return '';
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const headerLine = headers.map(escapeCell).join(',');
  const bodyLines = rows.map((row) => headers.map((h) => escapeCell(row[h])).join(','));
  return [headerLine, ...bodyLines].join('\n');
}
