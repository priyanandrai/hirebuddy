import express from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * POST /api/payments/webhook/razorpay - Razorpay Webhook (Raw Body HMAC Verification, No JWT needed)
 */
router.post('/webhook/razorpay', paymentController.handleRazorpayWebhook);

// All subsequent routes require authentication
router.use(authMiddleware);

/**
 * POST /api/payments/calculate-breakdown - Calculate complete dynamic Commission, GST, Sec 52 TCS & Sec 194-O TDS breakdown
 */
router.post('/calculate-breakdown', paymentController.calculatePaymentBreakdown);

/**
 * POST /api/payments/create-order - Create Razorpay/Cashfree marketplace payment order
 */
router.post('/create-order', paymentController.createPaymentOrder);

/**
 * POST /api/payments/verify - Verify payment signature & confirm booking
 */
router.post('/verify', paymentController.verifyPayment);

/**
 * POST /api/payments/release-escrow - Release held escrow payment or trigger helper Route payout
 */
router.post('/release-escrow', paymentController.releaseEscrowPayment);

/**
 * POST /api/payments/refund - Process full or partial marketplace refund with tax & commission reversal
 */
router.post('/refund', paymentController.refundPayment);

/**
 * GET /api/payments/subscription/status - Get Buddy subscription status (₹5/day or ₹99/month)
 */
router.get('/subscription/status', paymentController.getSubscriptionStatus);

/**
 * POST /api/payments/subscription/activate - Activate Buddy Daily (₹5) or Monthly (₹99) pass
 */
router.post('/subscription/activate', paymentController.activateSubscription);

/**
 * GET /api/payments/wallet - Get Wallet balance, escrow held, and ledger
 */
router.get('/wallet', paymentController.getWallet);

/**
 * POST /api/payments/wallet/topup - Add money to Wallet
 */
router.post('/wallet/topup', paymentController.topupWallet);

/**
 * POST /api/payments/wallet/withdraw - Withdraw funds from Wallet to UPI/Bank
 */
router.post('/wallet/withdraw', paymentController.withdrawWallet);

/**
 * POST /api/payments/wallet/pay-task - Pay for a task using Wallet balance
 */
router.post('/wallet/pay-task', paymentController.payTaskWithWallet);

/**
 * GET /api/payments/history - Get payment history
 */
router.get('/history', paymentController.getPaymentHistory);

/**
 * GET /api/payments/booking/:bookingId - Get payment, tax breakdown, payout & invoices for a booking
 */
router.get('/booking/:bookingId', paymentController.getBookingPayment);

/**
 * GET /api/payments/:paymentId - Get payment details (RBAC protected)
 */
router.get('/:paymentId', paymentController.getPaymentDetails);

/**
 * POST /api/payments/:paymentId/refund - Refund payment by ID
 */
router.post('/:paymentId/refund', paymentController.refundPayment);

export default router;
