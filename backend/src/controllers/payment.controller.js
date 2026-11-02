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
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      task_id,
      holdInEscrow,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification details' });
    }

    const result = await paymentService.handlePaymentSuccess(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      task_id,
      { holdInEscrow }
    );

    res.json({
      success: true,
      payment: result.payment,
      heldInEscrow: result.heldInEscrow,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Release held escrow payment for a task (100% to Buddy)
 */
export const releaseEscrowPayment = async (req, res) => {
  try {
    const { taskId, method, markAsPaid } = req.body;
    if (!taskId) {
      return res.status(400).json({ error: 'taskId is required' });
    }
    const result = await paymentService.releaseEscrowForTask(taskId, req.user?.id, {
      method,
      markAsPaid,
    });
    res.json(result);
  } catch (error) {
    console.error('Escrow release error:', error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Get Partner Subscription Status (₹5/day or ₹99/month)
 */
export const getSubscriptionStatus = async (req, res) => {
  try {
    const result = await paymentService.getPartnerSubscriptionStatus(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Subscription status error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Activate Partner Subscription (₹5/day or ₹99/month)
 */
export const activateSubscription = async (req, res) => {
  try {
    const { planType = 'DAILY', paymentMethod = 'ONLINE', razorpayPaymentId } = req.body;
    const result = await paymentService.activatePartnerSubscription(
      req.user.id,
      planType,
      paymentMethod,
      razorpayPaymentId
    );
    res.json(result);
  } catch (error) {
    console.error('Subscription activation error:', error);
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
