import Razorpay from 'razorpay';
import crypto from 'crypto';
import  prisma  from '../utils/prisma.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a Razorpay order for task payment
 */
export const createPaymentOrder = async (taskId, amount, payerId, payeeId) => {
  try {
    const options = {
      amount: amount, // in paise
      currency: 'INR',
      receipt: `receipt_${taskId}_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    // Save payment record in DB
    const payment = await prisma.payment.create({
      data: {
        taskId,
        payerId,
        payeeId,
        amount,
        razorpayOrderId: order.id,
        status: 'INITIATED',
      },
    });

    return {
      success: true,
      orderId: order.id,
      paymentId: payment.id,
      amount: order.amount,
      currency: order.currency,
    };
  } catch (error) {
    console.error('Payment order creation failed:', error);
    throw new Error('Failed to create payment order');
  }
};

/**
 * Verify Razorpay payment signature
 */
export const verifyPaymentSignature = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  try {
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    return expectedSignature === razorpaySignature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
};

/**
 * Handle successful payment
 */
export const handlePaymentSuccess = async (razorpayOrderId, razorpayPaymentId, razorpaySignature, taskId) => {
  try {
    // Verify signature
    const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      throw new Error('Invalid payment signature');
    }

    // Update payment status
    const payment = await prisma.payment.update({
      where: { razorpayOrderId },
      data: {
        razorpayPaymentId,
        razorpaySignature,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Update task status to IN_PROGRESS if payment successful
    await prisma.task.update({
      where: { id: taskId },
      data: { paymentStatus: 'COMPLETED' },
    });

    // Add funds to payee's wallet (simplified - real system needs proper settlement)
    await prisma.user.update({
      where: { id: payment.payeeId },
      data: { walletBalance: { increment: payment.amount } },
    });

    return { success: true, payment };
  } catch (error) {
    console.error('Payment success handling failed:', error);
    throw error;
  }
};

/**
 * Handle payment failure
 */
export const handlePaymentFailure = async (razorpayOrderId) => {
  try {
    await prisma.payment.update({
      where: { razorpayOrderId },
      data: { status: 'FAILED' },
    });

    return { success: true, message: 'Payment failed recorded' };
  } catch (error) {
    console.error('Payment failure handling failed:', error);
    throw error;
  }
};

/**
 * Get payment history for a user
 */
export const getPaymentHistory = async (userId, limit = 20, offset = 0) => {
  try {
    const payments = await prisma.payment.findMany({
      where: {
        OR: [
          { payerId: userId },
          { payeeId: userId },
        ],
      },
      include: {
        task: true,
        payer: { select: { id: true, name: true, image: true } },
        payee: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.payment.count({
      where: {
        OR: [
          { payerId: userId },
          { payeeId: userId },
        ],
      },
    });

    return { payments, total, limit, offset };
  } catch (error) {
    console.error('Failed to fetch payment history:', error);
    throw error;
  }
};

/**
 * Get payment details by ID
 */
export const getPaymentDetails = async (paymentId) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        task: true,
        payer: { select: { id: true, name: true, image: true } },
        payee: { select: { id: true, name: true, image: true } },
      },
    });

    return payment;
  } catch (error) {
    console.error('Failed to fetch payment details:', error);
    throw error;
  }
};

/**
 * Refund a payment
 */
export const refundPayment = async (paymentId, reason = 'Task cancelled') => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'COMPLETED') {
      throw new Error('Only completed payments can be refunded');
    }

    // Refund via Razorpay
    const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
      amount: payment.amount,
      reason: reason,
    });

    // Update payment status
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'REFUNDED' },
    });

    // Deduct from payee's wallet
    await prisma.user.update({
      where: { id: payment.payeeId },
      data: { walletBalance: { decrement: payment.amount } },
    });

    return { success: true, refund };
  } catch (error) {
    console.error('Refund failed:', error);
    throw error;
  }
};

export default {
  createPaymentOrder,
  verifyPaymentSignature,
  handlePaymentSuccess,
  handlePaymentFailure,
  getPaymentHistory,
  getPaymentDetails,
  refundPayment,
};
