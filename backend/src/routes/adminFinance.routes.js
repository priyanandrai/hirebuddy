import express from 'express';
import prisma from '../utils/prisma.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { ensureDefaultCommissionRules } from '../services/commission.service.js';
import { ensureDefaultTaxRules } from '../services/gstTaxEngine.service.js';
import { processHelperPayoutForBooking } from '../services/payout.service.js';
import { runMarketplaceReconciliation } from '../services/reconciliation.service.js';
import { ensureChartOfAccounts } from '../services/ledger.service.js';
import { toCsvString } from '../services/invoice.service.js';

const router = express.Router();

router.use(authMiddleware);

// Enforce Admin / Finance authorization on all /api/admin/* endpoints
router.use((req, res, next) => {
  if (!req.isAdmin && req.user?.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Forbidden: Only authorized Admin/Finance users can access financial and tax records.',
    });
  }
  next();
});

/**
 * GET /api/admin/payments - List all marketplace payments with financial & tax KPIs and filters
 */
router.get('/payments', async (req, res) => {
  try {
    const {
      status,
      supplyType,
      category,
      helperId,
      fromDate,
      toDate,
      format,
    } = req.query;

    const where = {};
    if (status && status !== 'ALL') where.status = status;
    if (supplyType && supplyType !== 'ALL') where.supplyType = supplyType;
    if (helperId) where.payeeId = helperId;
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }
    if (category && category !== 'ALL') {
      where.task = { category };
    }

    const [payments, payouts, refunds, reconciliations] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          task: { select: { id: true, title: true, category: true, status: true } },
          payer: { select: { id: true, name: true, phone: true, email: true } },
          payee: { select: { id: true, name: true, phone: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 300,
      }),
      prisma.helperPayout.findMany({ orderBy: { createdAt: 'desc' }, take: 300 }),
      prisma.refund.findMany({ orderBy: { createdAt: 'desc' }, take: 300 }),
      prisma.reconciliation.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
    ]);

    const capturedPayments = payments.filter((p) =>
      ['CONFIRMED', 'HELD_IN_ESCROW', 'RELEASED', 'SETTLED', 'COMPLETED', 'PARTIALLY_REFUNDED'].includes(
        p.status
      )
    );

    const kpisPaise = {
      totalGmvPaise: capturedPayments.reduce(
        (s, p) => s + Number(p.baseServicePaise || p.amount || 0),
        0
      ),
      totalCollectedPaise: capturedPayments.reduce((s, p) => s + Number(p.amount || 0), 0),
      totalCommissionPaise: capturedPayments.reduce(
        (s, p) => s + Number(p.commissionPaise || 0),
        0
      ),
      totalHelperEarningsPaise: capturedPayments.reduce(
        (s, p) => s + Number(p.netHelperEarningsPaise || 0),
        0
      ),
      totalPendingPayoutsPaise: payouts
        .filter((p) => ['PENDING', 'ON_HOLD', 'PROCESSING'].includes(p.status))
        .reduce((s, p) => s + Number(p.netPayoutPaise || 0), 0),
      totalCompletedPayoutsPaise: payouts
        .filter((p) => p.status === 'SETTLED')
        .reduce((s, p) => s + Number(p.netPayoutPaise || 0), 0),
      totalServiceGstPaise: capturedPayments.reduce(
        (s, p) => s + Number(p.gstOnServicePaise || 0),
        0
      ),
      totalCommissionGstPaise: capturedPayments.reduce(
        (s, p) => s + Number(p.gstOnCommissionPaise || 0),
        0
      ),
      totalTcsCollectedPaise: capturedPayments.reduce((s, p) => s + Number(p.tcsPaise || 0), 0),
      totalTdsDeductedPaise: capturedPayments.reduce((s, p) => s + Number(p.tdsPaise || 0), 0),
      totalGatewayChargesPaise: capturedPayments.reduce(
        (s, p) => s + Number((p.gatewayFeePaise || 0) + (p.gatewayGstPaise || 0)),
        0
      ),
      totalRefundsPaise: refunds.reduce((s, r) => s + Number(r.refundableCustomerPaise || 0), 0),
      failedTransactionsCount: payments.filter((p) => p.status === 'FAILED').length,
      pendingReconciliationsCount: reconciliations.filter(
        (r) => r.status === 'DISCREPANCY_FOUND'
      ).length,
    };

    if (format === 'csv') {
      const csvRows = payments.map((p) => ({
        paymentId: p.id,
        bookingId: p.taskId,
        category: p.task?.category || '',
        customerName: p.payer?.name || '',
        helperName: p.payee?.name || '',
        supplyType: p.supplyType,
        baseServiceINR: (p.baseServicePaise / 100).toFixed(2),
        commissionINR: (p.commissionPaise / 100).toFixed(2),
        gstOnServiceINR: (p.gstOnServicePaise / 100).toFixed(2),
        gstOnCommissionINR: (p.gstOnCommissionPaise / 100).toFixed(2),
        tcsINR: (p.tcsPaise / 100).toFixed(2),
        tdsINR: (p.tdsPaise / 100).toFixed(2),
        netHelperINR: (p.netHelperEarningsPaise / 100).toFixed(2),
        totalChargedINR: (p.amount / 100).toFixed(2),
        status: p.status,
        createdAt: p.createdAt.toISOString(),
      }));
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="hirebuddy_payments.csv"');
      return res.send(toCsvString(csvRows));
    }

    res.json({
      kpisPaise,
      kpisRupees: Object.fromEntries(
        Object.entries(kpisPaise).map(([k, v]) =>
          k.endsWith('Paise')
            ? [k.replace('Paise', 'Rupees'), Number((v / 100).toFixed(2))]
            : [k, v]
        )
      ),
      payments,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/payouts - List all Helper Payouts with filters
 */
router.get('/payouts', async (req, res) => {
  try {
    const { status, eligibilityStatus, helperId } = req.query;
    const where = {};
    if (status && status !== 'ALL') where.status = status;
    if (eligibilityStatus && eligibilityStatus !== 'ALL') {
      where.eligibilityStatus = eligibilityStatus;
    }
    if (helperId) where.helperId = helperId;

    const payouts = await prisma.helperPayout.findMany({
      where,
      include: {
        helper: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            idVerificationStatus: true,
          },
        },
        task: { select: { id: true, title: true, category: true, status: true } },
        attempts: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });

    res.json({ payouts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/payouts/:payoutId/approve - Admin approves & triggers a Helper Payout
 */
router.post('/payouts/:payoutId/approve', async (req, res) => {
  try {
    const { payoutId } = req.params;
    const payout = await prisma.helperPayout.findUnique({ where: { id: payoutId } });
    if (!payout) {
      return res.status(404).json({ error: 'Payout record not found' });
    }

    const result = await processHelperPayoutForBooking({
      paymentId: payout.paymentId,
      taskId: payout.taskId,
      approvedByAdminId: req.user?.id || 'admin',
    });

    await prisma.financialAuditLog.create({
      data: {
        actorId: req.user?.id || 'admin',
        actorRole: 'ADMIN',
        action: 'PAYOUT_APPROVED',
        entityType: 'HelperPayout',
        entityId: payout.id,
        newState: result.payout,
      },
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/admin/tax-reports - GST (Category/Sec 9(5)/Regular), Sec 52 TCS, Sec 194-O TDS & Invoices
 */
router.get('/tax-reports', async (req, res) => {
  try {
    const { taxPeriod, supplyClassification, format } = req.query;
    const txWhere = {};
    if (taxPeriod) txWhere.taxPeriod = taxPeriod;
    if (supplyClassification && supplyClassification !== 'ALL') {
      txWhere.supplyClassification = supplyClassification;
    }

    const [taxTransactions, tdsWithholdings, invoices] = await Promise.all([
      prisma.taxTransaction.findMany({
        where: txWhere,
        orderBy: { createdAt: 'desc' },
        take: 300,
      }),
      prisma.taxWithholding.findMany({
        orderBy: { createdAt: 'desc' },
        take: 300,
      }),
      prisma.invoice.findMany({
        orderBy: { createdAt: 'desc' },
        take: 300,
      }),
    ]);

    // Aggregate GST liability by service category
    const gstByCategory = {};
    for (const t of taxTransactions) {
      const cat = t.serviceCategory || 'Uncategorized';
      if (!gstByCategory[cat]) {
        gstByCategory[cat] = {
          serviceCategory: cat,
          supplyClassification: t.supplyClassification,
          sacCode: t.sacCode,
          transactionsCount: 0,
          taxableServicePaise: 0,
          serviceGstPaise: 0,
          taxableCommissionPaise: 0,
          commissionGstPaise: 0,
          tcsCollectedPaise: 0,
        };
      }
      gstByCategory[cat].transactionsCount += 1;
      gstByCategory[cat].taxableServicePaise += t.taxableServiceValuePaise;
      gstByCategory[cat].serviceGstPaise +=
        t.serviceCgstPaise + t.serviceSgstPaise + t.serviceIgstPaise;
      gstByCategory[cat].taxableCommissionPaise += t.taxableCommissionValuePaise;
      gstByCategory[cat].commissionGstPaise +=
        t.commissionCgstPaise + t.commissionSgstPaise + t.commissionIgstPaise;
      gstByCategory[cat].tcsCollectedPaise += t.totalTcsPaise;
    }

    if (format === 'csv') {
      const rows = taxTransactions.map((t) => ({
        id: t.id,
        taxPeriod: t.taxPeriod,
        serviceCategory: t.serviceCategory,
        supplyClassification: t.supplyClassification,
        sacCode: t.sacCode || '',
        supplierState: t.supplierStateCode,
        placeOfSupply: t.placeOfSupplyStateCode,
        taxableServiceINR: (t.taxableServiceValuePaise / 100).toFixed(2),
        serviceCgstINR: (t.serviceCgstPaise / 100).toFixed(2),
        serviceSgstINR: (t.serviceSgstPaise / 100).toFixed(2),
        serviceIgstINR: (t.serviceIgstPaise / 100).toFixed(2),
        taxableCommissionINR: (t.taxableCommissionValuePaise / 100).toFixed(2),
        commissionCgstINR: (t.commissionCgstPaise / 100).toFixed(2),
        commissionSgstINR: (t.commissionSgstPaise / 100).toFixed(2),
        commissionIgstINR: (t.commissionIgstPaise / 100).toFixed(2),
        tcsINR: (t.totalTcsPaise / 100).toFixed(2),
        createdAt: t.createdAt.toISOString(),
      }));
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="hirebuddy_gst_tcs_report.csv"');
      return res.send(toCsvString(rows));
    }

    res.json({
      gstByCategory: Object.values(gstByCategory),
      taxTransactions,
      tdsWithholdings: tdsWithholdings.map((w) => ({
        ...w,
        cumulativeFyGrossPaise: Number(w.cumulativeFyGrossPaise || 0n),
      })),
      invoices,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/reconciliation - Fetch reconciliation runs & discrepancies (or trigger a new run)
 */
router.get('/reconciliation', async (req, res) => {
  try {
    if (req.query.runNow === 'true') {
      await runMarketplaceReconciliation();
    }
    await ensureChartOfAccounts();
    const [reconciliations, accounts, journals] = await Promise.all([
      prisma.reconciliation.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.financialAccount.findMany({ orderBy: { code: 'asc' } }),
      prisma.ledgerJournal.findMany({
        include: { entries: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    res.json({
      reconciliations,
      chartOfAccounts: accounts.map((a) => ({
        ...a,
        balancePaise: Number(a.balancePaise || 0n),
        balanceRupees: Number((Number(a.balancePaise || 0n) / 100).toFixed(2)),
      })),
      recentJournals: journals,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET & POST /api/admin/commission-rules - Configure Dynamic Commission Rules
 */
router.get('/commission-rules', async (_req, res) => {
  try {
    await ensureDefaultCommissionRules();
    const rules = await prisma.commissionRule.findMany({
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
    });
    res.json({ rules });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/commission-rules', async (req, res) => {
  try {
    const {
      id,
      name,
      description,
      serviceCategory = null,
      helperId = null,
      commissionModel = 'PERCENTAGE',
      percentageBps = 1500,
      fixedAmountPaise = 0,
      minCommissionPaise = 0,
      maxCommissionPaise = null,
      isPromotional = false,
      promoCode = null,
      priority = 20,
      isActive = true,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Commission rule name is required' });
    }

    const data = {
      name,
      description,
      serviceCategory: serviceCategory || null,
      helperId: helperId || null,
      commissionModel,
      percentageBps: Number(percentageBps || 0),
      fixedAmountPaise: Number(fixedAmountPaise || 0),
      minCommissionPaise: Number(minCommissionPaise || 0),
      maxCommissionPaise:
        maxCommissionPaise !== null && maxCommissionPaise !== undefined && maxCommissionPaise !== ''
          ? Number(maxCommissionPaise)
          : null,
      isPromotional: Boolean(isPromotional),
      promoCode: promoCode || null,
      priority: Number(priority || 20),
      isActive: Boolean(isActive),
      createdByAdmin: req.user?.id || 'admin',
    };

    const rule = id
      ? await prisma.commissionRule.update({ where: { id }, data })
      : await prisma.commissionRule.create({ data });

    await prisma.financialAuditLog.create({
      data: {
        actorId: req.user?.id || 'admin',
        actorRole: 'ADMIN',
        action: id ? 'COMMISSION_RULE_UPDATED' : 'COMMISSION_RULE_CREATED',
        entityType: 'CommissionRule',
        entityId: rule.id,
        newState: rule,
      },
    });

    res.json({ success: true, rule });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET & POST /api/admin/tax-rules - Configure GST, Sec 9(5), Sec 52 TCS & Sec 194-O TDS Rules with CA Approval Status
 */
router.get('/tax-rules', async (_req, res) => {
  try {
    await ensureDefaultTaxRules();
    const rules = await prisma.taxRule.findMany({
      orderBy: { serviceCategory: 'asc' },
    });
    res.json({
      rules: rules.map((r) => ({
        ...r,
        tdsAnnualThresholdPaise: Number(r.tdsAnnualThresholdPaise || 50000000n),
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/tax-rules', async (req, res) => {
  try {
    const {
      id,
      serviceCategory,
      gstClassification = 'ORDINARY_MARKETPLACE',
      sacCode = null,
      gstOnServiceRateBps = 1800,
      gstOnCommissionRateBps = 1800,
      isSection95Applicable = false,
      isSection52TcsApplicable = true,
      tcsRateBps = 50,
      taxLiabilityOwner = 'HELPER_IF_REGISTERED',
      invoiceIssuer = 'HELPER_OR_PLATFORM_ON_BEHALF',
      requiresHelperGst = false,
      tdsSection = '194-O',
      tdsRateWithPanBps = 10,
      tdsRateNoPanBps = 500,
      tdsAnnualThresholdPaise = 50000000,
      approvalStatus = 'PENDING_CA_REVIEW',
      caReviewerName = null,
      caReviewNotes = null,
    } = req.body;

    if (!serviceCategory) {
      return res.status(400).json({ error: 'serviceCategory is required' });
    }

    // Safety guardrail: if Section 9(5) is enabled, Section 52 TCS must be false
    const resolvedSec95 =
      Boolean(isSection95Applicable) || gstClassification === 'SECTION_9_5';
    const resolvedSec52 = resolvedSec95 ? false : Boolean(isSection52TcsApplicable);

    // Safety guardrail: Cannot mark ACTIVE without CA reviewer name
    const resolvedApprovalStatus =
      approvalStatus === 'ACTIVE' && !caReviewerName
        ? 'PENDING_CA_REVIEW'
        : approvalStatus;

    const data = {
      serviceCategory,
      gstClassification: resolvedSec95 ? 'SECTION_9_5' : gstClassification,
      sacCode,
      gstOnServiceRateBps: Number(gstOnServiceRateBps),
      gstOnCommissionRateBps: Number(gstOnCommissionRateBps),
      isSection95Applicable: resolvedSec95,
      isSection52TcsApplicable: resolvedSec52,
      tcsRateBps: resolvedSec95 ? 0 : Number(tcsRateBps),
      taxLiabilityOwner: resolvedSec95 ? 'PLATFORM_9_5' : taxLiabilityOwner,
      invoiceIssuer,
      requiresHelperGst: Boolean(requiresHelperGst),
      tdsSection,
      tdsRateWithPanBps: Number(tdsRateWithPanBps),
      tdsRateNoPanBps: Number(tdsRateNoPanBps),
      tdsAnnualThresholdPaise: BigInt(tdsAnnualThresholdPaise),
      approvalStatus: resolvedApprovalStatus,
      caReviewerName,
      caReviewNotes,
      approvedAt: ['APPROVED', 'ACTIVE'].includes(resolvedApprovalStatus)
        ? new Date()
        : null,
    };

    const rule = id
      ? await prisma.taxRule.update({ where: { id }, data })
      : await prisma.taxRule.create({ data });

    await prisma.financialAuditLog.create({
      data: {
        actorId: req.user?.id || 'admin',
        actorRole: 'ADMIN',
        action: id ? 'TAX_RULE_UPDATED' : 'TAX_RULE_CREATED',
        entityType: 'TaxRule',
        entityId: rule.id,
        newState: {
          ...rule,
          tdsAnnualThresholdPaise: Number(rule.tdsAnnualThresholdPaise),
        },
      },
    });

    res.json({
      success: true,
      rule: {
        ...rule,
        tdsAnnualThresholdPaise: Number(rule.tdsAnnualThresholdPaise),
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
