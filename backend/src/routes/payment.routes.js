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
