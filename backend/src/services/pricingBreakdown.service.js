import prisma from '../utils/prisma.js';
import {
  ensureDefaultCommissionRules,
  resolveCommissionRule,
  calculateCommissionBreakdown,
} from './commission.service.js';
import {
  ensureDefaultTaxRules,
  resolveTaxRule,
  calculateGstAndTcsBreakdown,
} from './gstTaxEngine.service.js';
import { calculateSection194OTds } from './tdsWithholdingEngine.service.js';

/**
 * Orchestrates complete booking price, commission, Indian GST (Sec 9(5), Sec 52 TCS, Principal),
 * and Income-Tax TDS (Sec 194-O) calculation in integer paise.
 */
export async function calculateCompleteBookingBreakdown({
  serviceCategory,
  baseServicePaise,
  helperId = null,
  customerId = null,
  customerStateCode = 'UP',
  helperStateCode = null,
  platformStateCode = 'UP',
  promoCode = null,
  discountPaise = 0,
  discountFundedBy = 'NONE', // 'NONE' | 'PLATFORM' | 'HELPER'
  commissionGstMode = 'INCLUSIVE', // 'INCLUSIVE' (₹1000 -> ₹150 gross commission, ₹850 helper base) | 'EXCLUSIVE' (adds 18% GST on top of commission deduction)
  catchUpTdsOnThresholdBreach = false,
  customCommissionRule = null,
  customTaxRule = null,
  customHelperTaxProfile = null,
  gatewayFeeBps = 200,
  gstOnGatewayFeeBps = 1800,
  asOfDate = new Date(),
  enforceActiveApproval = false,
}) {
  await Promise.all([ensureDefaultCommissionRules(), ensureDefaultTaxRules()]);

  // 1. Load Helper Tax Profile if helperId is provided and no custom profile was passed
  let helperTaxProfile = customHelperTaxProfile;
  if (!helperTaxProfile && helperId) {
    helperTaxProfile = await prisma.helperTaxProfile.findUnique({
      where: { userId: helperId },
    });
  }
  if (!helperTaxProfile) {
    helperTaxProfile = {
      legalEntityType: 'INDIVIDUAL',
      panVerificationStatus: 'VERIFIED',
      panMasked: 'XXXXX0000A',
      isGstRegistered: false,
      stateCode: helperStateCode || 'UP',
      annualGrossTurnoverPaise: 0n,
    };
  }

  // 2. Resolve CommissionRule and TaxRule
  const [commissionRule, taxRule] = await Promise.all([
    resolveCommissionRule({
      serviceCategory,
      helperId,
      promoCode,
      asOfDate,
      customRuleOverride: customCommissionRule,
    }),
    resolveTaxRule({
      serviceCategory,
      asOfDate,
      customTaxRuleOverride: customTaxRule,
      enforceActiveApproval,
    }),
  ]);

  // 3. Calculate Commission & Promotional Discount Breakdown
  const commissionBreakdown = calculateCommissionBreakdown({
    baseServicePaise,
    commissionRule,
    discountPaise,
    discountFundedBy,
  });

  // 4. Calculate GST & Section 52 TCS Breakdown
  const gstBreakdown = calculateGstAndTcsBreakdown({
    taxableServiceBasePaise: commissionBreakdown.effectiveHelperServiceBasePaise,
    customerServiceBasePaise: commissionBreakdown.customerDiscountedServicePaise,
    commissionPaise: commissionBreakdown.commissionPaise,
    taxRule,
    helperTaxProfile,
    platformStateCode,
    customerStateCode,
    helperStateCode: helperStateCode || helperTaxProfile.stateCode || 'UP',
    gatewayFeeBps,
    gstOnGatewayFeeBps,
  });

  // 5. Calculate Section 194-O Income-Tax TDS on Gross Service Base
  const tdsBreakdown = calculateSection194OTds({
    grossServiceBasePaise: commissionBreakdown.effectiveHelperServiceBasePaise,
    helperTaxProfile,
    taxRule,
    asOfDate,
    catchUpOnThresholdBreach: catchUpTdsOnThresholdBreach,
  });

  // 6. Compute Final Helper Entitlement & Net Payable (integer paise)
  // In ORDINARY_MARKETPLACE where helper is GST-registered, service GST collected from customer belongs to helper's GST liability
  const helperServiceGstPassThroughPaise = gstBreakdown.helperServiceGstCollectedPaise;
  const commissionGstDeductedFromHelperPaise =
    commissionGstMode === 'EXCLUSIVE' ? gstBreakdown.gstOnCommissionPaise : 0;

  // If commissionGstMode is INCLUSIVE, the ₹150 commission includes GST or GST is accounted separately without reducing the ₹850 helper share
  const platformNetCommissionRevenuePaise =
    commissionGstMode === 'INCLUSIVE'
      ? Math.max(0, commissionBreakdown.commissionPaise - gstBreakdown.gstOnCommissionPaise)
      : commissionBreakdown.commissionPaise;

  const grossHelperCreditPaise =
    commissionBreakdown.effectiveHelperServiceBasePaise + helperServiceGstPassThroughPaise;

  const totalDeductionsFromHelperPaise =
    commissionBreakdown.commissionPaise +
    commissionGstDeductedFromHelperPaise +
    gstBreakdown.totalTcsPaise +
    tdsBreakdown.tdsDeductedPaise;

  const netHelperPayablePaise = Math.max(
    0,
    grossHelperCreditPaise - totalDeductionsFromHelperPaise
  );

  return {
    currency: 'INR',
    serviceCategory: serviceCategory || 'General Service',
    supplyClassification: gstBreakdown.supplyClassification,
    sacCode: gstBreakdown.sacCode,
    taxRuleApprovalStatus: gstBreakdown.approvalStatus,
    requiresCaReview: gstBreakdown.requiresCaReview,
    customerId,
    helperId,
    placeOfSupplyStateCode: gstBreakdown.placeOfSupplyStateCode,
    supplierStateCode: gstBreakdown.supplierStateCode,
    isInterState: gstBreakdown.isServiceInterState,

    // Customer-facing breakdown (in paise)
    baseServicePaise: commissionBreakdown.baseServicePaise,
    discountPaise: commissionBreakdown.discountPaise,
    platformDiscountPaise: commissionBreakdown.platformDiscountPaise,
    helperDiscountPaise: commissionBreakdown.helperDiscountPaise,
    customerDiscountedServicePaise: commissionBreakdown.customerDiscountedServicePaise,
    gstOnServicePaise: gstBreakdown.gstOnServicePaise,
    serviceCgstPaise: gstBreakdown.serviceCgstPaise,
    serviceSgstPaise: gstBreakdown.serviceSgstPaise,
    serviceIgstPaise: gstBreakdown.serviceIgstPaise,
    totalCustomerPayablePaise: gstBreakdown.totalCustomerPayablePaise,

    // Platform Commission & GST on Commission (in paise)
    appliedCommissionRuleId: commissionBreakdown.appliedRuleId,
    appliedCommissionRuleName: commissionBreakdown.appliedRuleName,
    commissionModel: commissionBreakdown.commissionModel,
    commissionRateBps: commissionBreakdown.commissionRateBps,
    commissionPaise: commissionBreakdown.commissionPaise,
    commissionGstMode,
    platformNetCommissionRevenuePaise,
    gstOnCommissionPaise: gstBreakdown.gstOnCommissionPaise,
    commissionCgstPaise: gstBreakdown.commissionCgstPaise,
    commissionSgstPaise: gstBreakdown.commissionSgstPaise,
    commissionIgstPaise: gstBreakdown.commissionIgstPaise,
    commissionGstDeductedFromHelperPaise,
    promoExpenseSubsidyPaise: commissionBreakdown.promoExpenseSubsidyPaise,

    // Statutory Withholdings (Section 52 GST TCS & Section 194-O Income-Tax TDS)
    appliedTaxRuleId: taxRule?.id || null,
    isSection52TcsApplicable: gstBreakdown.isSection52TcsApplicable,
    tcsRateBps: gstBreakdown.tcsRateBps,
    tcsPaise: gstBreakdown.totalTcsPaise,
    tcsCgstPaise: gstBreakdown.tcsCgstPaise,
    tcsSgstPaise: gstBreakdown.tcsSgstPaise,
    tcsIgstPaise: gstBreakdown.tcsIgstPaise,

    tdsSection: tdsBreakdown.section,
    tdsPanStatus: tdsBreakdown.panStatus,
    tdsRateBps: tdsBreakdown.tdsRateBps,
    tdsGrossBasePaise: tdsBreakdown.grossTransactionPaise,
    tdsPaise: tdsBreakdown.tdsDeductedPaise,
    tdsCumulativeFyGrossPaise: tdsBreakdown.cumulativeFyGrossPaise,
    isTdsThresholdReached: tdsBreakdown.isThresholdReached,

    // Helper Settlement Breakdown
    effectiveHelperServiceBasePaise: commissionBreakdown.effectiveHelperServiceBasePaise,
    helperEarningsBeforeTaxPaise: commissionBreakdown.helperEarningsBeforeTaxPaise,
    helperServiceGstPassThroughPaise,
    netHelperPayablePaise,

    // Gateway Fees & ITC
    gatewayFeePaise: gstBreakdown.gatewayFeePaise,
    gatewayGstPaise: gstBreakdown.gatewayGstPaise,

    // Full sub-breakdowns for audit & persistence
    commissionBreakdown,
    gstBreakdown,
    tdsBreakdown,
  };
}
