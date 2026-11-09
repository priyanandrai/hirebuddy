import prisma from '../utils/prisma.js';
import { assertIntegerPaise, multiplyBpsRound } from '../utils/cryptoVault.js';

/**
 * Seed configurable Indian GST & Tax Rules in MariaDB if table is empty.
 * Note: Rules are effective-dated and carry explicit CA approval statuses.
 */
export async function ensureDefaultTaxRules() {
  const count = await prisma.taxRule.count();
  if (count > 0) return;

  await prisma.taxRule.createMany({
    data: [
      {
        serviceCategory: 'Home Cleaning',
        gstClassification: 'SECTION_9_5',
        sacCode: '998533',
        gstOnServiceRateBps: 500, // Configurable (e.g. 5% under Sec 9(5) housekeeping services without ITC, subject to CA review)
        gstOnCommissionRateBps: 1800, // 18% GST on platform commission
        isSection95Applicable: true,
        isSection52TcsApplicable: false, // Never apply Sec 52 TCS on Sec 9(5) supplies
        tcsRateBps: 0,
        taxLiabilityOwner: 'PLATFORM_9_5',
        invoiceIssuer: 'PLATFORM',
        requiresHelperGst: false,
        tdsSection: '194-O',
        tdsRateWithPanBps: 10, // 0.10% (or 100 bps = 1.00% as configured by CA)
        tdsRateNoPanBps: 500, // 5.00% under Sec 206AA
        tdsAnnualThresholdPaise: 50000000n, // ₹5,00,000 in paise
        approvalStatus: 'ACTIVE',
        caReviewerName: 'Initial System Tax Setup (Verify with CA)',
        approvedAt: new Date(),
      },
      {
        serviceCategory: 'Plumbing',
        gstClassification: 'ORDINARY_MARKETPLACE',
        sacCode: '995462',
        gstOnServiceRateBps: 1800, // 18% when supplied by GST-registered helper
        gstOnCommissionRateBps: 1800, // 18% on HireBuddy platform commission
        isSection95Applicable: false,
        isSection52TcsApplicable: true,
        tcsRateBps: 50, // 0.50% (0.25% CGST + 0.25% SGST or 0.50% IGST)
        taxLiabilityOwner: 'HELPER_IF_REGISTERED',
        invoiceIssuer: 'HELPER_OR_PLATFORM_ON_BEHALF',
        requiresHelperGst: false,
        tdsSection: '194-O',
        tdsRateWithPanBps: 10,
        tdsRateNoPanBps: 500,
        tdsAnnualThresholdPaise: 50000000n,
        approvalStatus: 'ACTIVE',
        caReviewerName: 'Initial System Tax Setup (Verify with CA)',
        approvedAt: new Date(),
      },
      {
        serviceCategory: 'Electrician',
        gstClassification: 'ORDINARY_MARKETPLACE',
        sacCode: '995461',
        gstOnServiceRateBps: 1800,
        gstOnCommissionRateBps: 1800,
        isSection95Applicable: false,
        isSection52TcsApplicable: true,
        tcsRateBps: 50,
        taxLiabilityOwner: 'HELPER_IF_REGISTERED',
        invoiceIssuer: 'HELPER_OR_PLATFORM_ON_BEHALF',
        requiresHelperGst: false,
        tdsSection: '194-O',
        tdsRateWithPanBps: 10,
        tdsRateNoPanBps: 500,
        tdsAnnualThresholdPaise: 50000000n,
        approvalStatus: 'ACTIVE',
        caReviewerName: 'Initial System Tax Setup (Verify with CA)',
        approvedAt: new Date(),
      },
      {
        serviceCategory: 'Carpenter',
        gstClassification: 'ORDINARY_MARKETPLACE',
        sacCode: '995476',
        gstOnServiceRateBps: 1800,
        gstOnCommissionRateBps: 1800,
        isSection95Applicable: false,
        isSection52TcsApplicable: true,
        tcsRateBps: 50,
        taxLiabilityOwner: 'HELPER_IF_REGISTERED',
        invoiceIssuer: 'HELPER_OR_PLATFORM_ON_BEHALF',
        requiresHelperGst: false,
        tdsSection: '194-O',
        tdsRateWithPanBps: 10,
        tdsRateNoPanBps: 500,
        tdsAnnualThresholdPaise: 50000000n,
        approvalStatus: 'ACTIVE',
        caReviewerName: 'Initial System Tax Setup (Verify with CA)',
        approvedAt: new Date(),
      },
      {
        serviceCategory: 'Driver',
        gstClassification: 'ORDINARY_MARKETPLACE',
        sacCode: '996601',
        gstOnServiceRateBps: 1800,
        gstOnCommissionRateBps: 1800,
        isSection95Applicable: false,
        isSection52TcsApplicable: true,
        tcsRateBps: 50,
        taxLiabilityOwner: 'HELPER_IF_REGISTERED',
        invoiceIssuer: 'HELPER_OR_PLATFORM_ON_BEHALF',
        requiresHelperGst: false,
        tdsSection: '194-O',
        tdsRateWithPanBps: 10,
        tdsRateNoPanBps: 500,
        tdsAnnualThresholdPaise: 50000000n,
        approvalStatus: 'ACTIVE',
        caReviewerName: 'Initial System Tax Setup (Verify with CA)',
        approvedAt: new Date(),
      },
    ],
  });
}

/**
 * Split a total GST amount in paise into CGST + SGST (Intra-state) or IGST (Inter-state)
 * Guarantees cgstPaise + sgstPaise + igstPaise === totalGstPaise without 1-paise rounding loss.
 */
export function splitGstComponents(totalGstPaise, isInterState) {
  const total = assertIntegerPaise(totalGstPaise, 'totalGstPaise');
  if (total === 0) {
    return { cgstPaise: 0, sgstPaise: 0, igstPaise: 0, totalGstPaise: 0 };
  }
  if (isInterState) {
    return { cgstPaise: 0, sgstPaise: 0, igstPaise: total, totalGstPaise: total };
  }
  const cgstPaise = Math.floor(total / 2);
  const sgstPaise = total - cgstPaise;
  return { cgstPaise, sgstPaise, igstPaise: 0, totalGstPaise: total };
}

/**
 * Resolve effective-dated TaxRule for a service category.
 * Enforces CA-approval guardrail: unapproved rules are never silently activated in production.
 */
export async function resolveTaxRule({
  serviceCategory,
  asOfDate = new Date(),
  customTaxRuleOverride = null,
  enforceActiveApproval = process.env.NODE_ENV === 'production',
} = {}) {
  if (customTaxRuleOverride) {
    if (
      enforceActiveApproval &&
      !['ACTIVE', 'APPROVED'].includes(String(customTaxRuleOverride.approvalStatus || '').toUpperCase())
    ) {
      throw new Error(
        `Tax configuration for "${serviceCategory}" is in status ${customTaxRuleOverride.approvalStatus} and requires CA approval before activation.`
      );
    }
    return customTaxRuleOverride;
  }

  const normalizedCat = String(serviceCategory || '').trim();
  const candidates = await prisma.taxRule.findMany({
    where: {
      effectiveFrom: { lte: asOfDate },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: asOfDate } }],
    },
    orderBy: { updatedAt: 'desc' },
  });

  const matched = candidates.find(
    (r) => r.serviceCategory.trim().toLowerCase() === normalizedCat.toLowerCase()
  );

  if (!matched) {
    if (enforceActiveApproval) {
      throw new Error(
        `No CA-approved TaxRule found for category "${serviceCategory}". Marked PENDING_CA_REVIEW.`
      );
    }
    // Safe fallback marked as PENDING_CA_REVIEW in non-production environments
    return {
      id: 'unconfigured_pending_ca_review',
      serviceCategory: normalizedCat || 'General Service',
      gstClassification: 'ORDINARY_MARKETPLACE',
      sacCode: null,
      gstOnServiceRateBps: 1800,
      gstOnCommissionRateBps: 1800,
      isSection95Applicable: false,
      isSection52TcsApplicable: true,
      tcsRateBps: 50,
      taxLiabilityOwner: 'HELPER_IF_REGISTERED',
      invoiceIssuer: 'HELPER_OR_PLATFORM_ON_BEHALF',
      requiresHelperGst: false,
      tdsSection: '194-O',
      tdsRateWithPanBps: 10,
      tdsRateNoPanBps: 500,
      tdsAnnualThresholdPaise: 50000000n,
      approvalStatus: 'PENDING_CA_REVIEW',
    };
  }

  if (
    enforceActiveApproval &&
    !['ACTIVE', 'APPROVED'].includes(String(matched.approvalStatus).toUpperCase())
  ) {
    throw new Error(
      `TaxRule "${matched.id}" for "${serviceCategory}" has status ${matched.approvalStatus} and cannot be used until CA-approved and ACTIVE.`
    );
  }

  return matched;
}

/**
 * Calculate Complete Indian GST, Section 9(5), Principal Supply, Section 52 TCS & Gateway GST Breakdown
 * Supports:
 * - Classification A: ORDINARY_MARKETPLACE (Registered Helper vs Unregistered Helper)
 * - Classification B: SECTION_9_5 (Notified E-Commerce Operator Services; disables Sec 52 TCS)
 * - Classification C: PRINCIPAL_PROVIDER (HireBuddy contracts as Principal Supplier)
 * - Intra-State (CGST + SGST) vs Inter-State (IGST) for both underlying service and platform commission
 * - Gateway processing fee + GST on gateway fee (Input Tax Credit)
 */
export function calculateGstAndTcsBreakdown({
  taxableServiceBasePaise, // Underlying service value after helper-funded discount
  customerServiceBasePaise, // Customer-facing service price after any platform/helper discount
  commissionPaise,
  taxRule,
  helperTaxProfile = {},
  platformStateCode = 'UP',
  customerStateCode = 'UP',
  helperStateCode = null,
  gatewayFeeBps = 200, // 2.00%
  gstOnGatewayFeeBps = 1800, // 18.00%
}) {
  const serviceValuePaise = assertIntegerPaise(taxableServiceBasePaise, 'taxableServiceBasePaise');
  const customerBasePaise = assertIntegerPaise(
    customerServiceBasePaise ?? serviceValuePaise,
    'customerServiceBasePaise'
  );
  const platformCommissionPaise = assertIntegerPaise(commissionPaise, 'commissionPaise');

  const resolvedHelperState = String(
    helperStateCode || helperTaxProfile?.stateCode || platformStateCode || 'UP'
  )
    .trim()
    .toUpperCase();
  const resolvedCustomerState = String(customerStateCode || platformStateCode || 'UP')
    .trim()
    .toUpperCase();
  const resolvedPlatformState = String(platformStateCode || 'UP')
    .trim()
    .toUpperCase();

  const isServiceInterState = resolvedHelperState !== resolvedCustomerState;
  const isCommissionInterState = resolvedPlatformState !== resolvedHelperState;

  const classification = String(
    taxRule?.gstClassification ||
      (taxRule?.isSection95Applicable ? 'SECTION_9_5' : 'ORDINARY_MARKETPLACE')
  ).toUpperCase();

  const isHelperGstRegistered = Boolean(helperTaxProfile?.isGstRegistered);
  const serviceGstRateBps = assertIntegerPaise(
    taxRule?.gstOnServiceRateBps ?? 1800,
    'gstOnServiceRateBps'
  );
  const commissionGstRateBps = assertIntegerPaise(
    taxRule?.gstOnCommissionRateBps ?? 1800,
    'gstOnCommissionRateBps'
  );

  let gstOnServicePaise = 0;
  let serviceGstLiabilityOwner = 'NONE';
  let invoiceIssuer = taxRule?.invoiceIssuer || 'HELPER';
  let isSection52TcsApplied = false;
  let tcsRateBps = 0;
  let totalTcsPaise = 0;

  if (classification === 'SECTION_9_5') {
    // Classification B: Section 9(5) Notified Services
    // E-Commerce Operator (HireBuddy) is liable for GST on the full underlying service value
    // regardless of whether the helper is GST-registered.
    // Section 52 TCS MUST NOT be applied to a Section 9(5) supply.
    const isSec95InterState = resolvedPlatformState !== resolvedCustomerState;
    gstOnServicePaise = multiplyBpsRound(customerBasePaise, serviceGstRateBps);
    serviceGstLiabilityOwner = 'HIREBUDDY_SECTION_9_5';
    invoiceIssuer = 'HIREBUDDY_PLATFORM_9_5';
    isSection52TcsApplied = false;
    tcsRateBps = 0;
    totalTcsPaise = 0;

    const serviceGstSplit = splitGstComponents(gstOnServicePaise, isSec95InterState);
    const gstOnCommissionPaise = multiplyBpsRound(platformCommissionPaise, commissionGstRateBps);
    const commissionGstSplit = splitGstComponents(gstOnCommissionPaise, isCommissionInterState);

    const totalCustomerPayablePaise = customerBasePaise + gstOnServicePaise;
    const gatewayFeePaise = multiplyBpsRound(totalCustomerPayablePaise, gatewayFeeBps);
    const gatewayGstPaise = multiplyBpsRound(gatewayFeePaise, gstOnGatewayFeeBps);

    return {
      supplyClassification: 'SECTION_9_5',
      sacCode: taxRule?.sacCode || null,
      approvalStatus: taxRule?.approvalStatus || 'PENDING_CA_REVIEW',
      requiresCaReview: !['ACTIVE', 'APPROVED'].includes(String(taxRule?.approvalStatus || '')),
      taxLiabilityOwner: serviceGstLiabilityOwner,
      invoiceIssuer,
      supplierStateCode: resolvedPlatformState,
      placeOfSupplyStateCode: resolvedCustomerState,
      helperStateCode: resolvedHelperState,
      isServiceInterState: isSec95InterState,
      isCommissionInterState,
      isHelperGstRegistered,
      taxableServiceValuePaise: customerBasePaise,
      serviceGstRateBps,
      gstOnServicePaise,
      serviceCgstPaise: serviceGstSplit.cgstPaise,
      serviceSgstPaise: serviceGstSplit.sgstPaise,
      serviceIgstPaise: serviceGstSplit.igstPaise,
      taxableCommissionValuePaise: platformCommissionPaise,
      commissionGstRateBps,
      gstOnCommissionPaise,
      commissionCgstPaise: commissionGstSplit.cgstPaise,
      commissionSgstPaise: commissionGstSplit.sgstPaise,
      commissionIgstPaise: commissionGstSplit.igstPaise,
      isSection52TcsApplicable: false,
      tcsRateBps: 0,
      tcsNetTaxableBasePaise: 0,
      tcsCgstPaise: 0,
      tcsSgstPaise: 0,
      tcsIgstPaise: 0,
      totalTcsPaise: 0,
      totalCustomerPayablePaise,
      platformGstOutputLiabilityPaise: gstOnServicePaise + gstOnCommissionPaise,
      helperServiceGstCollectedPaise: 0,
      gatewayFeePaise,
      gatewayGstPaise,
    };
  }

  if (classification === 'PRINCIPAL_PROVIDER') {
    // Classification C: HireBuddy acts as Principal Service Provider
    const isPrincipalInterState = resolvedPlatformState !== resolvedCustomerState;
    gstOnServicePaise = multiplyBpsRound(customerBasePaise, serviceGstRateBps);
    serviceGstLiabilityOwner = 'HIREBUDDY_PRINCIPAL';
    invoiceIssuer = 'HIREBUDDY_PRINCIPAL';
    isSection52TcsApplied = false;

    const serviceGstSplit = splitGstComponents(gstOnServicePaise, isPrincipalInterState);
    // In Principal model, HireBuddy's entire consideration is taxed; no separate commission invoice to helper unless configured
    const gstOnCommissionPaise = 0;
    const totalCustomerPayablePaise = customerBasePaise + gstOnServicePaise;
    const gatewayFeePaise = multiplyBpsRound(totalCustomerPayablePaise, gatewayFeeBps);
    const gatewayGstPaise = multiplyBpsRound(gatewayFeePaise, gstOnGatewayFeeBps);

    return {
      supplyClassification: 'PRINCIPAL_PROVIDER',
      sacCode: taxRule?.sacCode || null,
      approvalStatus: taxRule?.approvalStatus || 'PENDING_CA_REVIEW',
      requiresCaReview: !['ACTIVE', 'APPROVED'].includes(String(taxRule?.approvalStatus || '')),
      taxLiabilityOwner: serviceGstLiabilityOwner,
      invoiceIssuer,
      supplierStateCode: resolvedPlatformState,
      placeOfSupplyStateCode: resolvedCustomerState,
      helperStateCode: resolvedHelperState,
      isServiceInterState: isPrincipalInterState,
      isCommissionInterState,
      isHelperGstRegistered,
      taxableServiceValuePaise: customerBasePaise,
      serviceGstRateBps,
      gstOnServicePaise,
      serviceCgstPaise: serviceGstSplit.cgstPaise,
      serviceSgstPaise: serviceGstSplit.sgstPaise,
      serviceIgstPaise: serviceGstSplit.igstPaise,
      taxableCommissionValuePaise: platformCommissionPaise,
      commissionGstRateBps: 0,
      gstOnCommissionPaise,
      commissionCgstPaise: 0,
      commissionSgstPaise: 0,
      commissionIgstPaise: 0,
      isSection52TcsApplicable: false,
      tcsRateBps: 0,
      tcsNetTaxableBasePaise: 0,
      tcsCgstPaise: 0,
      tcsSgstPaise: 0,
      tcsIgstPaise: 0,
      totalTcsPaise: 0,
      totalCustomerPayablePaise,
      platformGstOutputLiabilityPaise: gstOnServicePaise,
      helperServiceGstCollectedPaise: 0,
      gatewayFeePaise,
      gatewayGstPaise,
    };
  }

  // Classification A: ORDINARY_MARKETPLACE
  // 1. Underlying service GST: charged only if the independent helper is GST-registered
  if (isHelperGstRegistered) {
    gstOnServicePaise = multiplyBpsRound(customerBasePaise, serviceGstRateBps);
    serviceGstLiabilityOwner = 'HELPER_SUPPLIER';
    invoiceIssuer = 'HELPER_SUPPLIER';
  } else {
    gstOnServicePaise = 0;
    serviceGstLiabilityOwner = 'UNREGISTERED_HELPER_EXEMPT';
    invoiceIssuer = 'HELPER_BILL_OF_SUPPLY';
  }

  const serviceGstSplit = splitGstComponents(gstOnServicePaise, isServiceInterState);

  // 2. GST on HireBuddy's Platform Commission (Always HireBuddy's GST output liability)
  const gstOnCommissionPaise = multiplyBpsRound(platformCommissionPaise, commissionGstRateBps);
  const commissionGstSplit = splitGstComponents(gstOnCommissionPaise, isCommissionInterState);

  // 3. Section 52 GST TCS (Applicable on net taxable supplies by GST-registered suppliers through ECO)
  if (Boolean(taxRule?.isSection52TcsApplicable) && isHelperGstRegistered) {
    isSection52TcsApplied = true;
    tcsRateBps = assertIntegerPaise(taxRule?.tcsRateBps ?? 50, 'tcsRateBps');
    totalTcsPaise = multiplyBpsRound(serviceValuePaise, tcsRateBps);
  }

  const tcsSplit = splitGstComponents(totalTcsPaise, isServiceInterState);

  const totalCustomerPayablePaise = customerBasePaise + gstOnServicePaise;
  const gatewayFeePaise = multiplyBpsRound(totalCustomerPayablePaise, gatewayFeeBps);
  const gatewayGstPaise = multiplyBpsRound(gatewayFeePaise, gstOnGatewayFeeBps);

  return {
    supplyClassification: 'ORDINARY_MARKETPLACE',
    sacCode: taxRule?.sacCode || null,
    approvalStatus: taxRule?.approvalStatus || 'PENDING_CA_REVIEW',
    requiresCaReview: !['ACTIVE', 'APPROVED'].includes(String(taxRule?.approvalStatus || '')),
    taxLiabilityOwner: serviceGstLiabilityOwner,
    invoiceIssuer,
    supplierStateCode: resolvedHelperState,
    placeOfSupplyStateCode: resolvedCustomerState,
    helperStateCode: resolvedHelperState,
    isServiceInterState,
    isCommissionInterState,
    isHelperGstRegistered,
    taxableServiceValuePaise: customerBasePaise,
    serviceGstRateBps: isHelperGstRegistered ? serviceGstRateBps : 0,
    gstOnServicePaise,
    serviceCgstPaise: serviceGstSplit.cgstPaise,
    serviceSgstPaise: serviceGstSplit.sgstPaise,
    serviceIgstPaise: serviceGstSplit.igstPaise,
    taxableCommissionValuePaise: platformCommissionPaise,
    commissionGstRateBps,
    gstOnCommissionPaise,
    commissionCgstPaise: commissionGstSplit.cgstPaise,
    commissionSgstPaise: commissionGstSplit.sgstPaise,
    commissionIgstPaise: commissionGstSplit.igstPaise,
    isSection52TcsApplicable: isSection52TcsApplied,
    tcsRateBps,
    tcsNetTaxableBasePaise: isSection52TcsApplied ? serviceValuePaise : 0,
    tcsCgstPaise: tcsSplit.cgstPaise,
    tcsSgstPaise: tcsSplit.sgstPaise,
    tcsIgstPaise: tcsSplit.igstPaise,
    totalTcsPaise,
    totalCustomerPayablePaise,
    platformGstOutputLiabilityPaise: gstOnCommissionPaise,
    helperServiceGstCollectedPaise: gstOnServicePaise,
    gatewayFeePaise,
    gatewayGstPaise,
  };
}
