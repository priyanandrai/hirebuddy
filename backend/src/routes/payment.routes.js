import express from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/payments/create-order - Create Razorpay order
 */
router.post('/create-order', paymentController.createPaymentOrder);

/**
 * POST /api/payments/verify - Verify payment signature
 */
router.post('/verify', paymentController.verifyPayment);

/**
 * POST /api/payments/release-escrow - Release held escrow payment to Buddy
 */
router.post('/release-escrow', paymentController.releaseEscrowPayment);

/**
 * GET /api/payments/subscription/status - Get Buddy subscription status (₹5/day or ₹99/month)
 */
router.get('/subscription/status', paymentController.getSubscriptionStatus);

/**
 * POST /api/payments/subscription/activate - Activate Buddy Daily (₹5) or Monthly (₹99) pass
 */
router.post('/subscription/activate', paymentController.activateSubscription);

/**
 * GET /api/payments/history - Get payment history
 */
router.get('/history', paymentController.getPaymentHistory);

/**
 * GET /api/payments/:paymentId - Get payment details
 */
router.get('/:paymentId', paymentController.getPaymentDetails);

/**
 * POST /api/payments/:paymentId/refund - Refund payment
 */
router.post('/:paymentId/refund', paymentController.refundPayment);

export default router;
