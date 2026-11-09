import { assertIntegerPaise, multiplyBpsRound } from '../utils/cryptoVault.js';

/**
 * Determine Indian Financial Year and Quarter for a given Date
 * FY runs April 1 to March 31 (e.g., 2026-11-07 -> FY "2026-27", Quarter "Q3")
 */
export function getIndianTaxPeriod(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1..12

  const fyStartYear = month >= 4 ? year : year - 1;
  const fyEndYearShort = String((fyStartYear + 1) % 100).padStart(2, '0');
  const financialYear = `${fyStartYear}-${fyEndYearShort}`;

  let quarter = 'Q1';
  if (month >= 4 && month <= 6) quarter = 'Q1';
  else if (month >= 7 && month <= 9) quarter = 'Q2';
  else if (month >= 10 && month <= 12) quarter = 'Q3';
  else quarter = 'Q4';

  const taxPeriod = `${year}-${String(month).padStart(2, '0')}`;
  return { financialYear, quarter, taxPeriod };
}

/**
 * Calculate Income-Tax TDS under Section 194-O (and successor provisions under the Income-tax Act effective April 2026).
 *
 * Key Statutory Rules Enforced:
 * 1. Gross Base: TDS is calculated on the GROSS underlying service amount (`grossServiceBasePaise`),
 *    NEVER on the net payout after commission!
 * 2. Threshold Check (Scenario 16):
 *    - For INDIVIDUAL or HUF helpers with a VERIFIED PAN, no TDS is deducted while cumulative FY gross
 *      turnover is <= `tdsAnnualThresholdPaise` (e.g., ₹5,00,000 = 50,000,000 paise).
 *    - When a booking pushes cumulative FY gross turnover above the threshold:
 *      - If `catchUpOnThresholdBreach` is enabled (standard Sec 194-O practice), TDS applies on the cumulative gross
 *        (capped at the current payout capacity); otherwise on the taxable gross base.
 * 3. Missing / Unverified PAN (Scenario 15 - Sec 206AA):
 *    - The ₹5,00,000 threshold exemption does NOT apply when PAN is missing/unverified.
 *    - Higher configurable rate `tdsRateNoPanBps` (e.g. 500 bps = 5.00%) is applied immediately from ₹1.
 * 4. Lower / Nil TDS Exemption Certificate:
 *    - If the helper holds a valid Section 197 certificate (`tdsExemptCertificateNo` & `tdsExemptValidUntil >= now`),
 *      applies `lowerTdsRateBps` (which can be 0 bps).
 */
export function calculateSection194OTds({
  grossServiceBasePaise,
  helperTaxProfile = {},
  taxRule = {},
  asOfDate = new Date(),
  catchUpOnThresholdBreach = false,
}) {
  const grossPaise = assertIntegerPaise(grossServiceBasePaise, 'grossServiceBasePaise');
  const { financialYear, quarter } = getIndianTaxPeriod(asOfDate);

  const entityType = String(helperTaxProfile?.legalEntityType || 'INDIVIDUAL').toUpperCase();
  const isIndividualOrHuf = ['INDIVIDUAL', 'HUF', 'PROPRIETORSHIP'].includes(entityType);
  const isPanVerified =
    String(helperTaxProfile?.panVerificationStatus || '').toUpperCase() === 'VERIFIED' &&
    Boolean(helperTaxProfile?.panMasked || helperTaxProfile?.panEncrypted);

  const priorAnnualGrossPaise = Number(helperTaxProfile?.annualGrossTurnoverPaise || 0n);
  const newCumulativeFyGrossPaise = priorAnnualGrossPaise + grossPaise;

  const thresholdPaise = Number(
    taxRule?.tdsAnnualThresholdPaise ?? 50000000n // Default ₹5,00,000 in paise
  );

  const standardRateBps = assertIntegerPaise(
    taxRule?.tdsRateWithPanBps ?? 10, // Configurable: e.g. 10 bps (0.10%) or 100 bps (1.00%)
    'tdsRateWithPanBps'
  );
  const noPanHigherRateBps = assertIntegerPaise(
    taxRule?.tdsRateNoPanBps ?? 500, // Configurable: 500 bps (5.00%) under Sec 206AA
    'tdsRateNoPanBps'
  );

  // 1. Check valid Lower/Nil Deduction Certificate
  const hasValidExemptionCert =
    Boolean(helperTaxProfile?.tdsExemptCertificateNo) &&
    (!helperTaxProfile?.tdsExemptValidUntil ||
      new Date(helperTaxProfile.tdsExemptValidUntil) >= new Date(asOfDate));

  if (hasValidExemptionCert) {
    const certRateBps = assertIntegerPaise(
      helperTaxProfile?.lowerTdsRateBps ?? 0,
      'lowerTdsRateBps'
    );
    const tdsDeductedPaise = multiplyBpsRound(grossPaise, certRateBps);
    return {
      section: taxRule?.tdsSection || '194-O',
      financialYear,
      quarter,
      grossTransactionPaise: grossPaise,
      priorAnnualGrossPaise,
      cumulativeFyGrossPaise: newCumulativeFyGrossPaise,
      thresholdPaise,
      isThresholdReached: newCumulativeFyGrossPaise > thresholdPaise,
      panStatus: 'EXEMPT_CERTIFICATE',
      tdsRateBps: certRateBps,
      tdsDeductedPaise,
      status: tdsDeductedPaise > 0 ? 'DEDUCTED' : 'EXEMPT',
    };
  }

  // 2. Scenario 15: PAN is missing or unverified -> Sec 206AA higher rate applies immediately (no threshold benefit)
  if (!isPanVerified) {
    const tdsDeductedPaise = multiplyBpsRound(grossPaise, noPanHigherRateBps);
    return {
      section: taxRule?.tdsSection || '194-O',
      financialYear,
      quarter,
      grossTransactionPaise: grossPaise,
      priorAnnualGrossPaise,
      cumulativeFyGrossPaise: newCumulativeFyGrossPaise,
      thresholdPaise,
      isThresholdReached: true,
      panStatus: 'MISSING_HIGHER_RATE',
      tdsRateBps: noPanHigherRateBps,
      tdsDeductedPaise,
      status: tdsDeductedPaise > 0 ? 'DEDUCTED' : 'EXEMPT',
    };
  }

  // 3. Scenario 16: Verified PAN for Individual/HUF -> Check annual threshold
  if (isIndividualOrHuf && newCumulativeFyGrossPaise <= thresholdPaise) {
    return {
      section: taxRule?.tdsSection || '194-O',
      financialYear,
      quarter,
      grossTransactionPaise: grossPaise,
      priorAnnualGrossPaise,
      cumulativeFyGrossPaise: newCumulativeFyGrossPaise,
      thresholdPaise,
      isThresholdReached: false,
      panStatus: 'EXEMPT_BELOW_THRESHOLD',
      tdsRateBps: 0,
      tdsDeductedPaise: 0,
      status: 'EXEMPT',
    };
  }

  // 4. Threshold reached (or Corporate/Firm entity where threshold exemption does not apply)
  const justCrossedThreshold =
    isIndividualOrHuf &&
    priorAnnualGrossPaise <= thresholdPaise &&
    newCumulativeFyGrossPaise > thresholdPaise;

  const taxableBaseForTdsPaise =
    justCrossedThreshold && catchUpOnThresholdBreach
      ? newCumulativeFyGrossPaise
      : grossPaise;

  const rawTdsPaise = multiplyBpsRound(taxableBaseForTdsPaise, standardRateBps);
  const tdsDeductedPaise = Math.min(grossPaise, rawTdsPaise);

  return {
    section: taxRule?.tdsSection || '194-O',
    financialYear,
    quarter,
    grossTransactionPaise: grossPaise,
    priorAnnualGrossPaise,
    cumulativeFyGrossPaise: newCumulativeFyGrossPaise,
    thresholdPaise,
    isThresholdReached: true,
    justCrossedThreshold,
    panStatus: 'VERIFIED',
    tdsRateBps: standardRateBps,
    tdsDeductedPaise,
    status: tdsDeductedPaise > 0 ? 'DEDUCTED' : 'EXEMPT',
  };
}
