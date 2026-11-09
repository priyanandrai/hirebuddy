import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import prisma from '../src/utils/prisma.js';
import {
  assertIntegerPaise,
  rupeesToPaise,
  paiseToRupees,
  multiplyBpsRound,
  encryptSensitiveValue,
  decryptSensitiveValue,
  maskPan,
  maskBankAccount,
} from '../src/utils/cryptoVault.js';
import { calculateCommissionBreakdown } from '../src/services/commission.service.js';
import { calculateGstAndTcsBreakdown } from '../src/services/gstTaxEngine.service.js';
import { calculateSection194OTds } from '../src/services/tdsWithholdingEngine.service.js';
import {
  createMarketplacePaymentOrder,
  finalizeCapturedMarketplacePayment,
  processRazorpayWebhook,
  getBookingPaymentDetails,
} from '../src/services/marketplacePayment.service.js';
import {
  upsertHelperTaxProfile,
  upsertHelperBankAccount,
  processHelperPayoutForBooking,
} from '../src/services/payout.service.js';
import { processMarketplaceRefund } from '../src/services/refundEngine.service.js';
import {
  ensureChartOfAccounts,
  postJournalEntry,
  verifyLedgerTrialBalance,
} from '../src/services/ledger.service.js';

describe('HireBuddy Marketplace Payment, Indian GST, Sec 194-O TDS, Double-Entry Ledger & Helper Payout Suite', () => {
  let testCustomer;
  let testHelperVerified;
  let testHelperUnverifiedKyc;
  let testStrangerUser;
  const createdTaskIds = [];

  before(async () => {
    await ensureChartOfAccounts();

    const suffix = Date.now().toString().slice(-6);
    testCustomer = await prisma.user.create({
      data: {
        name: 'Test Customer Meerut',
        email: `cust_${suffix}@hirebuddy.test`,
        phone: `9100${suffix}`,
        role: 'USER',
      },
    });

    testHelperVerified = await prisma.user.create({
      data: {
        name: 'Verified Electrician Buddy',
        email: `helper_v_${suffix}@hirebuddy.test`,
        phone: `9200${suffix}`,
        role: 'HELPER',
        idVerificationStatus: 'VERIFIED',
      },
    });

    testHelperUnverifiedKyc = await prisma.user.create({
      data: {
        name: 'Unverified KYC Plumber',
        email: `helper_u_${suffix}@hirebuddy.test`,
        phone: `9300${suffix}`,
        role: 'HELPER',
        idVerificationStatus: 'PENDING',
      },
    });

    testStrangerUser = await prisma.user.create({
      data: {
        name: 'Unauthorized Stranger',
        email: `stranger_${suffix}@hirebuddy.test`,
        phone: `9400${suffix}`,
        role: 'USER',
      },
    });

    // Setup PAN & GST profile + Verified Bank Account for testHelperVerified
    await upsertHelperTaxProfile(testHelperVerified.id, {
      panNumber: 'ABCDE1234F',
      legalEntityType: 'COMPANY', // No ₹5L exemption threshold for Company -> immediate 0.1% TDS u/s 194-O
      isGstRegistered: true,
      gstin: '09ABCDE1234F1Z5',
      stateCode: 'UP',
    });

    await upsertHelperBankAccount(testHelperVerified.id, {
      beneficiaryName: 'Verified Electrician Buddy',
      accountNumber: '12345678901234',
      ifscCode: 'SBIN0001234',
      bankName: 'State Bank of India',
      verificationStatus: 'VERIFIED',
    });
  });

  after(async () => {
    try {
      const payments = await prisma.payment.findMany({
        where: { taskId: { in: createdTaskIds } },
        select: { id: true },
      });
      const paymentIds = payments.map((p) => p.id);

      await prisma.payoutAttempt.deleteMany({
        where: { payout: { taskId: { in: createdTaskIds } } },
      });
      await prisma.refundAdjustment.deleteMany({
        where: {
          helperId: {
            in: [testHelperVerified?.id, testHelperUnverifiedKyc?.id].filter(Boolean),
          },
        },
      });
      await prisma.refund.deleteMany({ where: { paymentId: { in: paymentIds } } });
      await prisma.helperPayout.deleteMany({ where: { taskId: { in: createdTaskIds } } });
      await prisma.taxWithholding.deleteMany({ where: { taskId: { in: createdTaskIds } } });
      await prisma.taxTransaction.deleteMany({ where: { taskId: { in: createdTaskIds } } });
      await prisma.invoice.deleteMany({ where: { taskId: { in: createdTaskIds } } });
      await prisma.paymentAttempt.deleteMany({ where: { paymentId: { in: paymentIds } } });
      await prisma.payment.deleteMany({ where: { id: { in: paymentIds } } });
      await prisma.task.deleteMany({ where: { id: { in: createdTaskIds } } });
      await prisma.helperBankAccount.deleteMany({
        where: {
          userId: {
            in: [testHelperVerified?.id, testHelperUnverifiedKyc?.id].filter(Boolean),
          },
        },
      });
      await prisma.helperTaxProfile.deleteMany({
        where: {
          userId: {
            in: [testHelperVerified?.id, testHelperUnverifiedKyc?.id].filter(Boolean),
          },
        },
      });
      await prisma.user.deleteMany({
        where: {
          id: {
            in: [
              testCustomer?.id,
              testHelperVerified?.id,
              testHelperUnverifiedKyc?.id,
              testStrangerUser?.id,
            ].filter(Boolean),
          },
        },
      });
    } catch (cleanupErr) {
      console.warn('Test cleanup warning:', cleanupErr.message);
    } finally {
      await prisma.$disconnect();
    }
  });

  // =========================================================================
  // TEST 20: Rounding, Integer Paise Conversion Accuracy & AES-256 Encryption
  // =========================================================================
  it('Test #20: enforces integer paise accuracy, deterministic bps rounding, and AES-256-GCM encryption/masking', () => {
    assert.equal(rupeesToPaise('1000.50'), 100050);
    assert.equal(rupeesToPaise(850), 85000);
    assert.equal(paiseToRupees(100050), '1000.50');

    // Reject floating point numbers in assertIntegerPaise
    assert.throws(() => assertIntegerPaise(100.5, 'amountPaise'), /Invalid integer paise/);

    // Deterministic half-up basis-point math: ₹1,000 (100,000 paise) * 15% (1500 bps) = 15,000 paise (₹150)
    assert.equal(multiplyBpsRound(100000, 1500), 15000);

    // AES-256-GCM encryption + masking for PAN & Bank Account
    const encryptedPan = encryptSensitiveValue('ABCDE1234F');
    assert.notEqual(encryptedPan, 'ABCDE1234F');
    assert.equal(decryptSensitiveValue(encryptedPan), 'ABCDE1234F');
    assert.equal(maskPan('ABCDE1234F'), 'XXXXX1234F');
    assert.equal(maskBankAccount('12345678901234'), 'XXXXXXXXXX1234');
  });

  // =========================================================================
  // TEST 6: Dynamic Commission Calculation (10%, 15%, Fixed, Zero, Discounts)
  // =========================================================================
  it('Test #6: calculates configurable commission models (15%, fixed, zero, platform vs helper funded discounts)', () => {
    // 1. Standard 15% commission on ₹1,000 (100,000 paise) -> Commission ₹150 (15,000 paise), Helper Gross ₹850 (85,000 paise)
    const std15 = calculateCommissionBreakdown({
      baseServicePaise: 100000,
      commissionRule: {
        id: 'rule_15',
        name: '15% Standard',
        commissionModel: 'PERCENTAGE',
        percentageBps: 1500,
      },
    });
    assert.equal(std15.commissionPaise, 15000);
    assert.equal(std15.helperEarningsBeforeTaxPaise, 85000);

    // 2. Zero commission for selected helpers
    const zeroComm = calculateCommissionBreakdown({
      baseServicePaise: 100000,
      commissionRule: {
        id: 'rule_zero',
        name: 'Zero Commission Helper Promo',
        commissionModel: 'ZERO',
        percentageBps: 0,
      },
    });
    assert.equal(zeroComm.commissionPaise, 0);
    assert.equal(zeroComm.helperEarningsBeforeTaxPaise, 100000);

    // 3. Scenario 24: Platform-funded discount (₹100 discount on ₹1,000 booking) -> Helper still gets base ₹850!
    const platformDiscount = calculateCommissionBreakdown({
      baseServicePaise: 100000,
      discountPaise: 10000,
      discountFundedBy: 'PLATFORM',
      commissionRule: {
        id: 'rule_15',
        name: '15% Standard',
        commissionModel: 'PERCENTAGE',
        percentageBps: 1500,
      },
    });
    assert.equal(platformDiscount.customerDiscountedServicePaise, 90000);
    assert.equal(platformDiscount.effectiveHelperServiceBasePaise, 100000);
    assert.equal(platformDiscount.helperEarningsBeforeTaxPaise, 85000);

    // 4. Scenario 25: Helper-funded discount (₹100 discount on ₹1,000 booking) -> Commission on ₹900 (₹135), Helper gets ₹765
    const helperDiscount = calculateCommissionBreakdown({
      baseServicePaise: 100000,
      discountPaise: 10000,
      discountFundedBy: 'HELPER',
      commissionRule: {
        id: 'rule_15',
        name: '15% Standard',
        commissionModel: 'PERCENTAGE',
        percentageBps: 1500,
      },
    });
    assert.equal(helperDiscount.effectiveHelperServiceBasePaise, 90000);
    assert.equal(helperDiscount.commissionPaise, 13500);
    assert.equal(helperDiscount.helperEarningsBeforeTaxPaise, 76500);
  });

  // =========================================================================
  // TEST 7, 9, 10, 11: Ordinary Marketplace GST, Intra-state CGST+SGST, Inter-state IGST & Sec 52 TCS
  // =========================================================================
  it('Tests #7, #9, #10, #11: calculates Ordinary Marketplace GST, Intra-state CGST+SGST, Inter-state IGST, and Section 52 TCS accurately', () => {
    const ordRule = {
      id: 'tax_ord',
      gstClassification: 'ORDINARY_MARKETPLACE',
      sacCode: '995461',
      gstOnServiceRateBps: 1800,
      gstOnCommissionRateBps: 1800,
      isSection95Applicable: false,
      isSection52TcsApplicable: true,
      tcsRateBps: 50, // 0.50% (0.25% CGST + 0.25% SGST)
      approvalStatus: 'ACTIVE',
    };

    // Scenario 1 + 8 (Test #7, #9, #11): Registered helper in UP, Customer in UP (Intra-state)
    const intraRegistered = calculateGstAndTcsBreakdown({
      taxableServiceBasePaise: 100000,
      customerServiceBasePaise: 100000,
      commissionPaise: 15000,
      taxRule: ordRule,
      helperTaxProfile: { isGstRegistered: true, gstin: '09ABCDE1234F1Z5', stateCode: 'UP' },
      platformStateCode: 'UP',
      customerStateCode: 'UP',
      helperStateCode: 'UP',
    });

    assert.equal(intraRegistered.isServiceInterState, false);
    assert.equal(intraRegistered.serviceCgstPaise, 9000);
    assert.equal(intraRegistered.serviceSgstPaise, 9000);
    assert.equal(intraRegistered.serviceIgstPaise, 0);
    assert.equal(intraRegistered.commissionCgstPaise, 1350);
    assert.equal(intraRegistered.commissionSgstPaise, 1350);
    assert.equal(intraRegistered.isSection52TcsApplicable, true);
    assert.equal(intraRegistered.tcsCgstPaise, 250);
    assert.equal(intraRegistered.tcsSgstPaise, 250);
    assert.equal(intraRegistered.totalTcsPaise, 500);

    // Scenario 7 (Test #10): Inter-state supply (Helper in UP, Customer in DL -> IGST)
    const interState = calculateGstAndTcsBreakdown({
      taxableServiceBasePaise: 100000,
      customerServiceBasePaise: 100000,
      commissionPaise: 15000,
      taxRule: ordRule,
      helperTaxProfile: { isGstRegistered: true, gstin: '09ABCDE1234F1Z5', stateCode: 'UP' },
      platformStateCode: 'UP',
      customerStateCode: 'DL',
      helperStateCode: 'UP',
    });
    assert.equal(interState.isServiceInterState, true);
    assert.equal(interState.serviceCgstPaise, 0);
    assert.equal(interState.serviceSgstPaise, 0);
    assert.equal(interState.serviceIgstPaise, 18000);
    assert.equal(interState.tcsIgstPaise, 500);
    assert.equal(interState.totalTcsPaise, 500);

    // Scenario 2: Unregistered individual helper under ordinary marketplace rules
    const unregisteredHelper = calculateGstAndTcsBreakdown({
      taxableServiceBasePaise: 100000,
      customerServiceBasePaise: 100000,
      commissionPaise: 15000,
      taxRule: ordRule,
      helperTaxProfile: { isGstRegistered: false, stateCode: 'UP' },
      platformStateCode: 'UP',
      customerStateCode: 'UP',
      helperStateCode: 'UP',
    });
    assert.equal(unregisteredHelper.gstOnServicePaise, 0);
    assert.equal(unregisteredHelper.gstOnCommissionPaise, 2700);
    assert.equal(unregisteredHelper.totalTcsPaise, 0);
  });

  // =========================================================================
  // TEST 8: Section 9(5) Notified Service GST Calculation
  // =========================================================================
  it('Test #8: calculates Section 9(5) Notified Service GST on full underlying value and disables Section 52 TCS', () => {
    const sec95 = calculateGstAndTcsBreakdown({
      taxableServiceBasePaise: 100000,
      customerServiceBasePaise: 100000,
      commissionPaise: 15000,
      taxRule: {
        id: 'tax_95',
        gstClassification: 'SECTION_9_5',
        sacCode: '998533',
        gstOnServiceRateBps: 1800,
        gstOnCommissionRateBps: 1800,
        isSection95Applicable: true,
        isSection52TcsApplicable: true, // Engine must override to false for Section 9(5)
        tcsRateBps: 50,
        approvalStatus: 'ACTIVE',
      },
      helperTaxProfile: { isGstRegistered: false, stateCode: 'UP' },
      platformStateCode: 'UP',
      customerStateCode: 'UP',
      helperStateCode: 'UP',
    });

    assert.equal(sec95.supplyClassification, 'SECTION_9_5');
    assert.equal(sec95.taxLiabilityOwner, 'HIREBUDDY_SECTION_9_5');
    assert.equal(sec95.gstOnServicePaise, 18000);
    assert.equal(sec95.isSection52TcsApplicable, false);
    assert.equal(sec95.totalTcsPaise, 0);
  });

  // =========================================================================
  // TEST 12: Section 194-O Income Tax TDS Calculation (Threshold, Verified PAN, Missing PAN 5%)
  // =========================================================================
  it('Test #12: calculates Section 194-O Income-Tax TDS across Individual threshold, Verified PAN (0.1%), and Missing PAN (5% u/s 206AA)', () => {
    // 1. Individual below ₹5,00,000 FY threshold with verified PAN -> Exempt (0 TDS)
    const belowThreshold = calculateSection194OTds({
      grossServiceBasePaise: 100000, // ₹1,000
      helperTaxProfile: {
        legalEntityType: 'INDIVIDUAL',
        panVerificationStatus: 'VERIFIED',
        panMasked: 'AB******4F',
        annualGrossTurnoverPaise: 10000000n, // ₹1,00,000 so far (< ₹5,00,000)
      },
    });
    assert.equal(belowThreshold.status, 'EXEMPT');
    assert.equal(belowThreshold.tdsDeductedPaise, 0);

    // 2. Scenario 16: Individual crossing ₹5,00,000 FY threshold with verified PAN -> 0.1% (10 bps) on gross service value
    const aboveThreshold = calculateSection194OTds({
      grossServiceBasePaise: 100000, // ₹1,000 (100,000 paise)
      helperTaxProfile: {
        legalEntityType: 'INDIVIDUAL',
        panVerificationStatus: 'VERIFIED',
        panMasked: 'AB******4F',
        annualGrossTurnoverPaise: 50000000n, // Already at ₹5,00,000
      },
    });
    assert.equal(aboveThreshold.status, 'DEDUCTED');
    assert.equal(aboveThreshold.tdsRateBps, 10); // 0.1%
    assert.equal(aboveThreshold.tdsDeductedPaise, 100); // ₹1.00 (100 paise) on ₹1,000 gross base

    // 3. Scenario 15: Helper PAN unavailable -> 5% (500 bps) higher rate under Sec 206AA
    const missingPan = calculateSection194OTds({
      grossServiceBasePaise: 100000, // ₹1,000
      helperTaxProfile: {
        legalEntityType: 'INDIVIDUAL',
        panVerificationStatus: 'UNVERIFIED',
        panMasked: null,
        annualGrossTurnoverPaise: 100000n,
      },
    });
    assert.equal(missingPan.status, 'DEDUCTED');
    assert.equal(missingPan.tdsRateBps, 500); // 5%
    assert.equal(missingPan.tdsDeductedPaise, 5000); // ₹50.00 (5,000 paise)
  });

  // =========================================================================
  // TEST 1, 3, 4, 5: Customer Payment Order, Webhook Verification, Duplicate & Delayed Webhooks, Invalid Signature
  // =========================================================================
  it('Tests #1, #3, #4, #5: processes successful booking payment, blocks invalid webhook signatures, and handles duplicate/delayed webhooks idempotently', async () => {
    const task = await prisma.task.create({
      data: {
        title: 'Full Home Electrical Wiring Inspection',
        description: 'Complete check of MCB and wiring',
        category: 'Electrician',
        budget: 100000, // ₹1,000 in paise
        location: 'Meerut, UP',
        latitude: 28.9845,
        longitude: 77.7064,
        createdById: testCustomer.id,
        assignedToId: testHelperVerified.id,
        status: 'ASSIGNED',
      },
    });
    createdTaskIds.push(task.id);

    // 1. Create Marketplace Payment Order (with idempotency key)
    const idemKey = `test_ord_1_${Date.now()}`;
    const orderRes = await createMarketplacePaymentOrder({
      taskId: task.id,
      payerId: testCustomer.id,
      payeeId: testHelperVerified.id,
      baseServicePaise: 100000,
      customerStateCode: 'UP',
      helperStateCode: 'UP',
      idempotencyKey: idemKey,
    });

    assert.equal(orderRes.success, true);
    assert.equal(orderRes.breakdown.baseServicePaise, 100000);
    assert.equal(orderRes.breakdown.commissionPaise, 15000);

    // Replay same idempotency key -> returns existing order without creating duplicate
    const replayOrder = await createMarketplacePaymentOrder({
      taskId: task.id,
      payerId: testCustomer.id,
      payeeId: testHelperVerified.id,
      baseServicePaise: 100000,
      idempotencyKey: idemKey,
    });
    assert.equal(replayOrder.idempotentReplay, true);
    assert.equal(replayOrder.paymentId, orderRes.paymentId);

    // Test #5: Invalid Webhook Signature must be rejected with 400
    const webhookSecret = 'test_webhook_secret_hb_2026';
    const webhookPayloadObj = {
      id: `evt_capture_${Date.now()}`,
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_rzp_${Date.now()}`,
            order_id: orderRes.orderId,
            amount: orderRes.amount,
            status: 'captured',
          },
        },
      },
    };
    const rawWebhookBody = JSON.stringify(webhookPayloadObj);

    await assert.rejects(
      () =>
        processRazorpayWebhook({
          rawBody: rawWebhookBody,
          signature: 'invalid_tampered_signature_12345',
          eventId: webhookPayloadObj.id,
          payload: webhookPayloadObj,
          customWebhookSecret: webhookSecret,
        }),
      /INVALID_WEBHOOK_SIGNATURE/
    );

    // Test #1: Valid Webhook Signature confirms booking, records TaxTransaction, TaxWithholding, HelperPayout (ON_HOLD), Invoices & Double-Entry Journal
    const validSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawWebhookBody)
      .digest('hex');

    const webhookRes = await processRazorpayWebhook({
      rawBody: rawWebhookBody,
      signature: validSignature,
      eventId: webhookPayloadObj.id,
      payload: webhookPayloadObj,
      customWebhookSecret: webhookSecret,
    });

    assert.equal(webhookRes.success, true);
    assert.equal(webhookRes.duplicate, false);
    assert.equal(webhookRes.result.payment.status, 'CONFIRMED');
    assert.equal(webhookRes.result.helperPayout.status, 'ON_HOLD');
    assert.equal(webhookRes.result.helperPayout.eligibilityStatus, 'PENDING_COMPLETION');
    assert.ok(webhookRes.result.invoices.length >= 2);

    // Test #3: Duplicate webhook (same eventId) -> ignored idempotently
    const duplicateWebhookRes = await processRazorpayWebhook({
      rawBody: rawWebhookBody,
      signature: validSignature,
      eventId: webhookPayloadObj.id,
      payload: webhookPayloadObj,
      customWebhookSecret: webhookSecret,
    });
    assert.equal(duplicateWebhookRes.duplicate, true);
    assert.equal(duplicateWebhookRes.status, 'DUPLICATE_IGNORED');

    // Test #4: Delayed webhook (different eventId for order.paid arriving after payment is already CONFIRMED)
    const delayedPayloadObj = {
      id: `evt_delayed_${Date.now()}`,
      event: 'order.paid',
      payload: webhookPayloadObj.payload,
    };
    const delayedRaw = JSON.stringify(delayedPayloadObj);
    const delayedSig = crypto.createHmac('sha256', webhookSecret).update(delayedRaw).digest('hex');

    const delayedRes = await processRazorpayWebhook({
      rawBody: delayedRaw,
      signature: delayedSig,
      eventId: delayedPayloadObj.id,
      payload: delayedPayloadObj,
      customWebhookSecret: webhookSecret,
    });
    assert.equal(delayedRes.success, true);
    assert.equal(delayedRes.result.alreadyProcessed, true);
  });

  // =========================================================================
  // TEST 2: Failed Payment Webhook Handling
  // =========================================================================
  it('Test #2: records failed payment attempt and marks payment FAILED on payment.failed webhook', async () => {
    const task = await prisma.task.create({
      data: {
        title: 'Failed Payment Test Booking',
        description: 'Testing payment failure',
        category: 'Plumbing',
        budget: 50000,
        location: 'Meerut, UP',
        latitude: 28.9845,
        longitude: 77.7064,
        createdById: testCustomer.id,
        assignedToId: testHelperVerified.id,
        status: 'OPEN',
      },
    });
    createdTaskIds.push(task.id);

    const orderRes = await createMarketplacePaymentOrder({
      taskId: task.id,
      payerId: testCustomer.id,
      payeeId: testHelperVerified.id,
      baseServicePaise: 50000,
    });

    const secret = 'test_webhook_secret_hb_2026';
    const failedEvent = {
      id: `evt_failed_${Date.now()}`,
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: `pay_fail_${Date.now()}`,
            order_id: orderRes.orderId,
            error_code: 'BAD_REQUEST_ERROR',
            error_description: 'UPI PIN incorrect',
          },
        },
      },
    };
    const raw = JSON.stringify(failedEvent);
    const sig = crypto.createHmac('sha256', secret).update(raw).digest('hex');

    await processRazorpayWebhook({
      rawBody: raw,
      signature: sig,
      eventId: failedEvent.id,
      payload: failedEvent,
      customWebhookSecret: secret,
    });

    const updatedPayment = await prisma.payment.findUnique({
      where: { id: orderRes.paymentId },
    });
    assert.equal(updatedPayment.status, 'FAILED');
  });

  // =========================================================================
  // TEST 13, 14, 17: Payout Blocked on Incomplete KYC / Unfinished Task, Payout After Completion, Duplicate Payout Prevention
  // =========================================================================
  it('Tests #13, #14, #17: blocks payout when KYC is incomplete or service not completed, settles after completion, and prevents duplicate payouts', async () => {
    // 1. Test #14 (Scenario 14): Helper with incomplete KYC cannot receive payout even after task completion
    const kycTask = await prisma.task.create({
      data: {
        title: 'Plumbing Pipe Repair (Incomplete KYC Helper)',
        description: 'Fix kitchen sink pipe',
        category: 'Plumbing',
        budget: 80000,
        location: 'Meerut, UP',
        latitude: 28.9845,
        longitude: 77.7064,
        createdById: testCustomer.id,
        assignedToId: testHelperUnverifiedKyc.id,
        status: 'ASSIGNED',
      },
    });
    createdTaskIds.push(kycTask.id);

    const kycOrder = await createMarketplacePaymentOrder({
      taskId: kycTask.id,
      payerId: testCustomer.id,
      payeeId: testHelperUnverifiedKyc.id,
      baseServicePaise: 80000,
    });

    await finalizeCapturedMarketplacePayment({
      razorpayOrderId: kycOrder.orderId,
      razorpayPaymentId: `pay_kyc_${Date.now()}`,
      verifySignature: false,
    });

    // Mark task COMPLETED, but helper KYC is still PENDING
    await prisma.task.update({
      where: { id: kycTask.id },
      data: { status: 'COMPLETED' },
    });

    const blockedKycPayout = await processHelperPayoutForBooking({
      paymentId: kycOrder.paymentId,
      taskId: kycTask.id,
    });

    assert.equal(blockedKycPayout.eligible, false);
    assert.equal(blockedKycPayout.eligibilityStatus, 'HELD_KYC_INCOMPLETE');
    assert.equal(blockedKycPayout.payout.status, 'ON_HOLD');

    // 2. Test #13: Verified Helper completes service -> Payout succeeds via Razorpay Route
    const verifiedTask = await prisma.task.findFirst({
      where: { id: createdTaskIds[0] },
    });
    const verifiedPayment = await prisma.payment.findFirst({
      where: { taskId: verifiedTask.id },
    });

    // Before task completion -> payout must be blocked with PENDING_COMPLETION
    const beforeCompletion = await processHelperPayoutForBooking({
      paymentId: verifiedPayment.id,
      taskId: verifiedTask.id,
    });
    assert.equal(beforeCompletion.eligible, false);
    assert.equal(beforeCompletion.eligibilityStatus, 'PENDING_COMPLETION');

    // Now mark booking COMPLETED
    await prisma.task.update({
      where: { id: verifiedTask.id },
      data: { status: 'COMPLETED' },
    });

    const settledPayout = await processHelperPayoutForBooking({
      paymentId: verifiedPayment.id,
      taskId: verifiedTask.id,
    });

    assert.equal(settledPayout.success, true);
    assert.equal(settledPayout.payout.status, 'SETTLED');
    assert.ok(settledPayout.payout.utrNumber);

    // 3. Test #17: Attempting to trigger payout again for the same booking must throw DUPLICATE_PAYOUT_PREVENTED
    await assert.rejects(
      () =>
        processHelperPayoutForBooking({
          paymentId: verifiedPayment.id,
          taskId: verifiedTask.id,
        }),
      /DUPLICATE_PAYOUT_PREVENTED/
    );
  });

  // =========================================================================
  // TEST 15 & 16: Full Refund Before Payout & Partial Refund After Payout (With Helper Recovery Ledger)
  // =========================================================================
  it('Tests #15 & #16: processes full refund before payout and partial refund after payout with automatic helper recovery adjustment', async () => {
    // 1. Test #15: Full refund before service starts / before payout
    const prePayoutTask = await prisma.task.create({
      data: {
        title: 'Carpentry Door Repair (Cancelled Before Start)',
        description: 'Repair wooden door hinge',
        category: 'Carpenter',
        budget: 100000,
        location: 'Meerut, UP',
        latitude: 28.9845,
        longitude: 77.7064,
        createdById: testCustomer.id,
        assignedToId: testHelperVerified.id,
        status: 'ASSIGNED',
      },
    });
    createdTaskIds.push(prePayoutTask.id);

    const preOrder = await createMarketplacePaymentOrder({
      taskId: prePayoutTask.id,
      payerId: testCustomer.id,
      payeeId: testHelperVerified.id,
      baseServicePaise: 100000,
    });

    await finalizeCapturedMarketplacePayment({
      razorpayOrderId: preOrder.orderId,
      razorpayPaymentId: `pay_pre_${Date.now()}`,
      verifySignature: false,
    });

    const fullRefundRes = await processMarketplaceRefund({
      paymentId: preOrder.paymentId,
      requestedById: testCustomer.id,
      cancelledByRole: 'CUSTOMER',
      cancellationStage: 'BEFORE_START',
      reason: 'Customer cancelled before helper arrived',
    });

    assert.equal(fullRefundRes.success, true);
    assert.equal(fullRefundRes.refund.refundType, 'FULL');
    assert.equal(fullRefundRes.refund.refundableCustomerPaise, preOrder.amount);
    assert.ok(fullRefundRes.creditNote.invoiceNumber.startsWith('HB/CN/'));

    // 2. Test #16 (Scenario 10 & 21): Partial refund AFTER helper payout is already SETTLED -> creates RefundAdjustment recovery
    const settledPayment = await prisma.payment.findFirst({
      where: { taskId: createdTaskIds[0] },
    });

    const postPayoutPartialRefund = await processMarketplaceRefund({
      paymentId: settledPayment.id,
      requestedById: testCustomer.id,
      cancelledByRole: 'ADMIN',
      cancellationStage: 'PARTIAL_COMPLETION', // 50% partial refund after payout
      reason: 'Partial refund for incomplete switchboard polishing after payout',
    });

    assert.equal(postPayoutPartialRefund.success, true);
    assert.equal(postPayoutPartialRefund.refund.refundType, 'PARTIAL');
    assert.equal(postPayoutPartialRefund.refund.wasHelperAlreadyPaid, true);
    assert.ok(postPayoutPartialRefund.refundAdjustment);
    assert.equal(postPayoutPartialRefund.refundAdjustment.status, 'OPEN');
    assert.ok(postPayoutPartialRefund.refundAdjustment.remainingPaise > 0);
  });

  // =========================================================================
  // TEST 18: Unauthorized Access to Another User's Payment or Booking (RBAC)
  // =========================================================================
  it('Test #18: blocks unauthorized access to another user payment or booking details with 403 Forbidden', async () => {
    const bookingId = createdTaskIds[0];

    // Customer can view their own booking payment
    const customerView = await getBookingPaymentDetails(bookingId, testCustomer.id, false);
    assert.equal(customerView.bookingId, bookingId);

    // Assigned Helper can view their booking payment
    const helperView = await getBookingPaymentDetails(bookingId, testHelperVerified.id, false);
    assert.equal(helperView.bookingId, bookingId);

    // Unrelated stranger user must be blocked with 403 Forbidden
    await assert.rejects(
      () => getBookingPaymentDetails(bookingId, testStrangerUser.id, false),
      (err) => err.statusCode === 403 && /Forbidden/.test(err.message)
    );
  });

  // =========================================================================
  // TEST 19: Double-Entry Ledger Trial Balance Verification
  // =========================================================================
  it('Test #19: enforces double-entry accounting (Total Debits == Total Credits) across all journals and rejects unbalanced entries', async () => {
    // 1. Verify that all journals posted during payment capture, payout settlement, and refunds are strictly balanced
    const trialBalance = await verifyLedgerTrialBalance();
    assert.equal(trialBalance.isBalanced, true);
    assert.equal(trialBalance.discrepancyPaise, 0);
    assert.equal(trialBalance.unbalancedJournalsCount, 0);
    assert.ok(trialBalance.totalDebitsPaise > 0);

    // 2. Verify that attempting to post an unbalanced journal entry is rejected immediately
    await assert.rejects(
      () =>
        postJournalEntry({
          eventType: 'TEST_UNBALANCED',
          description: 'Should fail double-entry check',
          lines: [
            { accountCode: '1001_CUSTOMER_PAYMENT_CLEARING', debitPaise: 10000, creditPaise: 0 },
            { accountCode: '4001_PLATFORM_COMMISSION_REVENUE', debitPaise: 0, creditPaise: 9500 }, // Mismatch by 500 paise!
          ],
        }),
      /Unbalanced double-entry journal/
    );
  });
});
