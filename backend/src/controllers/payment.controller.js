import * as paymentService from '../services/payment.service.js';

/**
 * Create payment order (Razorpay)
 */
export const createPaymentOrder = async (req, res) => {
  try {
    const { taskId, amount } = req.body;
    const userId = req.user.id;

    if (!taskId || !amount) {
      return res.status(400).json({ error: 'taskId and amount are required' });
    }

    const result = await paymentService.createPaymentOrder(taskId, amount, userId, null);

    res.json(result);
  } catch (error) {
    console.error('Payment order creation error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Verify and handle payment success
 */
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, task_id } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification details' });
    }

    const result = await paymentService.handlePaymentSuccess(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      task_id
    );

    res.json({ success: true, payment: result.payment });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Get payment history
 */
export const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    const result = await paymentService.getPaymentHistory(userId, parseInt(limit), parseInt(offset));

    res.json(result);
  } catch (error) {
    console.error('Payment history fetch error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get payment details
 */
export const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await paymentService.getPaymentDetails(paymentId);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Payment details fetch error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Refund payment
 */
export const refundPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;

    const result = await paymentService.refundPayment(paymentId, reason);

    res.json(result);
  } catch (error) {
    console.error('Payment refund error:', error);
    res.status(500).json({ error: error.message });
  }
};

export default {
  createPaymentOrder,
  verifyPayment,
  getPaymentHistory,
  getPaymentDetails,
  refundPayment,
};
