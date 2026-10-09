import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from '../utils/prisma.js';
import { notificationEvents, sendNotification } from './notification.service.js';
import { emitToUser } from '../config/socket.config.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'your_razorpay_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_key_secret',
});

/**
 * Create a Razorpay order for task payment
 */
export const createPaymentOrder = async (taskId, amount, payerId, payeeId = null) => {
  try {
    let resolvedPayeeId = payeeId;
    let task = null;

    if (!resolvedPayeeId || !taskId) {
      task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { id: true, assignedToId: true, createdById: true },
      });
      resolvedPayeeId = resolvedPayeeId || task?.assignedToId || task?.createdById || payerId;
    }

    let order;
    const isRealRazorpay =
      process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_ID !== 'your_razorpay_key_id' &&
      !process.env.RAZORPAY_KEY_ID.includes('placeholder');

    if (isRealRazorpay) {
      const options = {
        amount: Math.round(amount), // in paise
        currency: 'INR',
        receipt: `receipt_${taskId}_${Date.now()}`,
        payment_capture: 1,
      };
      order = await razorpay.orders.create(options);
    } else {
      order = {
        id: `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        amount: Math.round(amount),
        currency: 'INR',
      };
    }

    // Save payment record in DB
    const payment = await prisma.payment.create({
      data: {
        taskId,
        payerId,
        payeeId: resolvedPayeeId,
        amount: Math.round(amount),
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
    throw new Error(error.message || 'Failed to create payment order');
  }
};

/**
 * Verify Razorpay payment signature
 */
export const verifyPaymentSignature = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  try {
    const isRealSecret =
      process.env.RAZORPAY_KEY_SECRET &&
      process.env.RAZORPAY_KEY_SECRET !== 'your_razorpay_key_secret' &&
      !process.env.RAZORPAY_KEY_SECRET.includes('placeholder');

    if (!isRealSecret || razorpayOrderId.startsWith('order_mock_')) {
      return true;
    }

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
      include: {
        task: { select: { id: true, title: true } },
      },
    });

    const targetTaskId = taskId || payment.taskId;

    // Update task payment status
    if (targetTaskId) {
      await prisma.task.update({
        where: { id: targetTaskId },
        data: { paymentStatus: 'COMPLETED' },
      });
    }

    // Add funds to payee's wallet
    if (payment.payeeId) {
      await prisma.user.update({
        where: { id: payment.payeeId },
        data: { walletBalance: { increment: payment.amount } },
      });

      // Trigger notification & live alert to payee (helper)
      try {
        await notificationEvents.paymentReceived(
          payment.taskId,
          payment.payeeId,
          payment.payerId,
          payment.amount
        );

        emitToUser(payment.payeeId, 'payment_notification', {
          taskId: payment.taskId,
          amount: payment.amount,
          message: `Payment of ₹${(payment.amount / 100).toFixed(2)} received!`,
        });
      } catch (notifErr) {
        console.warn('Payee payment notification failed:', notifErr?.message);
      }
    }

    // Trigger notification to payer (customer)
    if (payment.payerId) {
      try {
        const taskTitle = payment.task?.title || 'your task';
        await sendNotification(
          payment.taskId,
          payment.payeeId || payment.payerId,
          payment.payerId,
          'payment_success',
          'Payment Successful!',
          `Your payment of ₹${(payment.amount / 100).toFixed(2)} for "${taskTitle}" was successful.`
        );
      } catch (payerErr) {
        console.warn('Payer payment notification failed:', payerErr?.message);
      }
    }

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
