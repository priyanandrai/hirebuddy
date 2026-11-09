import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
  getHelperEarningsLedger,
  processHelperPayoutForBooking,
  upsertHelperTaxProfile,
  upsertHelperBankAccount,
} from '../services/payout.service.js';
import prisma from '../utils/prisma.js';

const router = express.Router();

router.use(authMiddleware);

/**
 * GET /api/helpers/earnings - Get Helper Accounting Ledger & Earnings Summary
 */
router.get('/earnings', async (req, res) => {
  try {
    const targetHelperId =
      req.isAdmin && req.query.helperId ? req.query.helperId : req.user.id;
    const ledger = await getHelperEarningsLedger(targetHelperId);
    res.json(ledger);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/helpers/payouts - Get Helper Payout History & Eligibility Status
 */
router.get('/payouts', async (req, res) => {
  try {
    const targetHelperId =
      req.isAdmin && req.query.helperId ? req.query.helperId : req.user.id;

    const payouts = await prisma.helperPayout.findMany({
      where: { helperId: targetHelperId },
      include: {
        task: { select: { id: true, title: true, category: true, status: true } },
        attempts: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ payouts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/helpers/payouts/request - Request / Initiate Payout for an Eligible Completed Booking
 */
router.post('/payouts/request', async (req, res) => {
  try {
    const { paymentId, taskId, idempotencyKey } = req.body;
    let targetPaymentId = paymentId;

    if (!targetPaymentId && taskId) {
      const p = await prisma.payment.findFirst({
        where: { taskId, payeeId: req.user.id },
        orderBy: { createdAt: 'desc' },
      });
      targetPaymentId = p?.id;
    }

    if (!targetPaymentId) {
      return res.status(400).json({ error: 'paymentId or taskId is required' });
    }

    const payment = await prisma.payment.findUnique({ where: { id: targetPaymentId } });
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Security check: only the assigned helper or an admin can request payout
    if (!req.isAdmin && payment.payeeId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: Cannot request payout for another helper' });
    }

    const result = await processHelperPayoutForBooking({
      paymentId: targetPaymentId,
      taskId: payment.taskId,
      idempotencyKey,
    });

    res.json(result);
  } catch (error) {
    const status = error.code === 'DUPLICATE_PAYOUT' ? 409 : 400;
    res.status(status).json({ error: error.message, code: error.code });
  }
});

/**
 * POST /api/helpers/tax-profile - Update Helper Tax Profile (PAN, GSTIN, Legal Entity Type)
 */
router.post('/tax-profile', async (req, res) => {
  try {
    const targetHelperId =
      req.isAdmin && req.body.helperId ? req.body.helperId : req.user.id;
    const profile = await upsertHelperTaxProfile(targetHelperId, req.body);
    res.json({ success: true, taxProfile: profile });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/helpers/bank-account - Add / Verify Helper Bank Account for Route Payouts
 */
router.post('/bank-account', async (req, res) => {
  try {
    const targetHelperId =
      req.isAdmin && req.body.helperId ? req.body.helperId : req.user.id;
    const bankAccount = await upsertHelperBankAccount(targetHelperId, req.body);
    res.json({ success: true, bankAccount });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
