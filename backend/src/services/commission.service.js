import prisma from '../utils/prisma.js';
import { assertIntegerPaise, multiplyBpsRound } from '../utils/cryptoVault.js';

/**
 * Default fallback commission rule when no DB rule matches (15% = 1500 bps)
 */
export const DEFAULT_COMMISSION_RULE = {
  id: 'default_15_pct',
  name: 'Standard Marketplace Commission (15%)',
  commissionModel: 'PERCENTAGE',
  percentageBps: 1500,
  fixedAmountPaise: 0,
  minCommissionPaise: 0,
  maxCommissionPaise: null,
  isPromotional: false,
};

/**
 * Seed default commission rules in MariaDB if table is empty
 */
export async function ensureDefaultCommissionRules() {
  const count = await prisma.commissionRule.count();
  if (count > 0) return;

  await prisma.commissionRule.createMany({
    data: [
      {
        name: 'Global Standard Commission (15%)',
        description: 'Default 15% commission across all service categories',
        serviceCategory: null,
        helperId: null,
        commissionModel: 'PERCENTAGE',
        percentageBps: 1500,
        fixedAmountPaise: 0,
        priority: 10,
        isActive: true,
      },
      {
        name: 'Home Cleaning Commission (15%)',
        description: '15% commission for Home Cleaning bookings',
        serviceCategory: 'Home Cleaning',
        commissionModel: 'PERCENTAGE',
        percentageBps: 1500,
        priority: 20,
        isActive: true,
      },
      {
        name: 'Plumbing & Electrician Commission (10%)',
        description: '10% commission for Plumbing services',
        serviceCategory: 'Plumbing',
        commissionModel: 'PERCENTAGE',
        percentageBps: 1000,
        priority: 20,
        isActive: true,
      },
      {
        name: 'Driver Services Commission (20%)',
        description: '20% commission for Driver bookings',
        serviceCategory: 'Driver',
        commissionModel: 'PERCENTAGE',
        percentageBps: 2000,
        priority: 20,
        isActive: true,
      },
    ],
  });
}

/**
 * Resolve the highest-priority active CommissionRule for a booking
 * Hierarchy: Helper-Specific > Promo Code > Category-Specific > Global Default
 */
export async function resolveCommissionRule({
  serviceCategory,
  helperId = null,
  promoCode = null,
  asOfDate = new Date(),
  customRuleOverride = null,
} = {}) {
  if (customRuleOverride) {
    return customRuleOverride;
  }

  const activeRules = await prisma.commissionRule.findMany({
    where: {
      isActive: true,
      effectiveFrom: { lte: asOfDate },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: asOfDate } }],
    },
    orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
  });

  if (!activeRules.length) {
    return DEFAULT_COMMISSION_RULE;
  }

  const normalizedCat = String(serviceCategory || '').trim().toLowerCase();
  const normalizedPromo = promoCode ? String(promoCode).trim().toUpperCase() : null;

  // 1. Helper-specific rule
  if (helperId) {
    const helperRule = activeRules.find((r) => r.helperId === helperId);
    if (helperRule) return helperRule;
  }

  // 2. Promotional rule
  if (normalizedPromo) {
    const promoRule = activeRules.find(
      (r) =>
        r.isPromotional &&
        r.promoCode &&
        String(r.promoCode).trim().toUpperCase() === normalizedPromo &&
        (!r.serviceCategory || r.serviceCategory.trim().toLowerCase() === normalizedCat)
    );
    if (promoRule) return promoRule;
  }

  // 3. Category-specific rule
  if (normalizedCat) {
    const categoryRule = activeRules.find(
      (r) =>
        !r.helperId &&
        !r.isPromotional &&
        r.serviceCategory &&
        r.serviceCategory.trim().toLowerCase() === normalizedCat
    );
    if (categoryRule) return categoryRule;
  }

  // 4. Global rule
  const globalRule = activeRules.find((r) => !r.helperId && !r.serviceCategory && !r.isPromotional);
  return globalRule || DEFAULT_COMMISSION_RULE;
}

/**
 * Calculate dynamic commission & discount impact in integer paise.
 * Supports:
 * - PERCENTAGE (e.g. 10%, 15%, 20% via basis points)
 * - FIXED (fixed paise per booking)
 * - HYBRID (percentage + fixed paise)
 * - ZERO (0% commission for selected helpers / Buddy pass holders)
 * - Platform-funded vs Helper-funded discounts (Scenarios 23, 24, 25)
 */
export function calculateCommissionBreakdown({
  baseServicePaise,
  commissionRule = DEFAULT_COMMISSION_RULE,
  discountPaise = 0,
  discountFundedBy = 'NONE', // 'NONE' | 'PLATFORM' | 'HELPER'
}) {
  const grossBasePaise = assertIntegerPaise(baseServicePaise, 'baseServicePaise');
  const rawDiscountPaise = Math.min(
    grossBasePaise,
    assertIntegerPaise(discountPaise || 0, 'discountPaise')
  );

  const platformDiscountPaise = discountFundedBy === 'PLATFORM' ? rawDiscountPaise : 0;
  const helperDiscountPaise = discountFundedBy === 'HELPER' ? rawDiscountPaise : 0;

  // If discount is helper-funded, the underlying service base itself is reduced.
  // If discount is platform-funded, helper still earns on full grossBasePaise while customer pays less.
  const effectiveHelperServiceBasePaise = grossBasePaise - helperDiscountPaise;
  const customerDiscountedServicePaise = grossBasePaise - rawDiscountPaise;

  const model = String(commissionRule?.commissionModel || 'PERCENTAGE').toUpperCase();
  const rateBps = assertIntegerPaise(commissionRule?.percentageBps ?? 1500, 'percentageBps');
  const fixedPaise = assertIntegerPaise(commissionRule?.fixedAmountPaise ?? 0, 'fixedAmountPaise');

  let grossCommissionPaise = 0;

  if (model === 'ZERO' || (model === 'PERCENTAGE' && rateBps === 0 && fixedPaise === 0)) {
    grossCommissionPaise = 0;
  } else if (model === 'FIXED') {
    grossCommissionPaise = Math.min(effectiveHelperServiceBasePaise, fixedPaise);
  } else if (model === 'HYBRID') {
    grossCommissionPaise =
      multiplyBpsRound(effectiveHelperServiceBasePaise, rateBps) + fixedPaise;
  } else {
    // PERCENTAGE
    grossCommissionPaise = multiplyBpsRound(effectiveHelperServiceBasePaise, rateBps);
  }

  // Apply min / max caps if configured
  const minCap = assertIntegerPaise(commissionRule?.minCommissionPaise || 0, 'minCommissionPaise');
  if (grossCommissionPaise < minCap && model !== 'ZERO') {
    grossCommissionPaise = minCap;
  }
  if (
    commissionRule?.maxCommissionPaise !== null &&
    commissionRule?.maxCommissionPaise !== undefined
  ) {
    const maxCap = assertIntegerPaise(commissionRule.maxCommissionPaise, 'maxCommissionPaise');
    if (grossCommissionPaise > maxCap) {
      grossCommissionPaise = maxCap;
    }
  }

  // Commission cannot exceed the helper's service base
  grossCommissionPaise = Math.min(effectiveHelperServiceBasePaise, grossCommissionPaise);

  // Helper gross earnings after commission (before statutory TCS/TDS deductions)
  const helperGrossAfterCommissionPaise = effectiveHelperServiceBasePaise - grossCommissionPaise;

  // Net platform revenue after platform-funded promotional discount
  const netPlatformCommissionAfterPromoPaise = Math.max(
    0,
    grossCommissionPaise - platformDiscountPaise
  );
  const promoExpenseSubsidyPaise = Math.max(
    0,
    platformDiscountPaise - grossCommissionPaise
  );

  return {
    appliedRuleId: commissionRule?.id || 'default_15_pct',
    appliedRuleName: commissionRule?.name || 'Standard Commission',
    commissionModel: model,
    commissionRateBps: model === 'ZERO' ? 0 : rateBps,
    fixedCommissionPaise: fixedPaise,
    baseServicePaise: grossBasePaise,
    discountPaise: rawDiscountPaise,
    platformDiscountPaise,
    helperDiscountPaise,
    effectiveHelperServiceBasePaise,
    customerDiscountedServicePaise,
    commissionPaise: grossCommissionPaise,
    netPlatformCommissionAfterPromoPaise,
    promoExpenseSubsidyPaise,
    helperEarningsBeforeTaxPaise: helperGrossAfterCommissionPaise,
  };
}
