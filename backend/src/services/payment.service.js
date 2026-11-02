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
 * Handle successful payment (supports Escrow Hold + 100% release to Buddy on completion)
 */
export const handlePaymentSuccess = async (
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  taskId,
  options = {}
) => {
  try {
    // Verify signature
    const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      throw new Error('Invalid payment signature');
    }

    const existingPayment = await prisma.payment.findFirst({
      where: { razorpayOrderId },
      include: {
        task: { select: { id: true, title: true, status: true, assignedToId: true, createdById: true } },
      },
    });

    if (!existingPayment) {
      throw new Error('Payment record not found for order');
    }

    const targetTaskId = taskId || existingPayment.taskId;
    const taskRecord =
      existingPayment.task ||
      (targetTaskId
        ? await prisma.task.findUnique({
            where: { id: targetTaskId },
            select: { id: true, title: true, status: true, assignedToId: true, createdById: true },
          })
        : null);

    // Hold payment in escrow unless task is already COMPLETED and immediate release is requested
    const shouldHoldInEscrow =
      options.holdInEscrow !== undefined
        ? Boolean(options.holdInEscrow)
        : taskRecord?.status !== 'COMPLETED';

    const newPaymentStatus = shouldHoldInEscrow ? 'HELD_IN_ESCROW' : 'COMPLETED';

    // Update payment status
    const payment = await prisma.payment.update({
      where: { id: existingPayment.id },
      data: {
        razorpayPaymentId,
        razorpaySignature,
        payeeId: taskRecord?.assignedToId || existingPayment.payeeId,
        status: newPaymentStatus,
        completedAt: shouldHoldInEscrow ? null : new Date(),
      },
      include: {
        task: { select: { id: true, title: true, status: true } },
      },
    });

    // Update task payment status
    if (targetTaskId) {
      await prisma.task.update({
        where: { id: targetTaskId },
        data: {
          paymentStatus: shouldHoldInEscrow ? 'HELD_IN_ESCROW' : 'COMPLETED',
          razorpayOrderId,
        },
      });
    }

    const formattedAmount = (payment.amount / 100).toFixed(2);
    const taskTitle = payment.task?.title || 'your task';

    if (shouldHoldInEscrow) {
      // Notify Buddy that payment is secured in Escrow (100% will be released on completion)
      if (payment.payeeId && payment.payeeId !== payment.payerId) {
        try {
          await sendNotification(
            payment.taskId,
            payment.payerId,
            payment.payeeId,
            'payment_escrow_held',
            'Payment Secured in Escrow!',
            `₹${formattedAmount} for "${taskTitle}" is now held in HireBuddy Escrow. 100% will be released to your wallet once the task is completed.`
          );
          emitToUser(payment.payeeId, 'payment_notification', {
            taskId: payment.taskId,
            amount: payment.amount,
            status: 'HELD_IN_ESCROW',
            message: `₹${formattedAmount} secured in Escrow for "${taskTitle}"!`,
          });
        } catch (err) {
          console.warn('Escrow payee notification failed:', err?.message);
        }
      }

      // Notify Customer
      if (payment.payerId) {
        try {
          await sendNotification(
            payment.taskId,
            payment.payeeId || payment.payerId,
            payment.payerId,
            'payment_escrow_held',
            'Payment Held Safely in Escrow',
            `Your payment of ₹${formattedAmount} for "${taskTitle}" is held safely. It will be released to the Buddy only after task completion.`
          );
        } catch (err) {
          console.warn('Escrow payer notification failed:', err?.message);
        }
      }

      return { success: true, payment, heldInEscrow: true };
    }

    // Immediate release (100% goes to the Buddy — 0% task commission)
    if (payment.payeeId) {
      await prisma.user.update({
        where: { id: payment.payeeId },
        data: { walletBalance: { increment: payment.amount } },
      });

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
          status: 'COMPLETED',
          message: `100% Payment of ₹${formattedAmount} credited to your wallet!`,
        });
      } catch (notifErr) {
        console.warn('Payee payment notification failed:', notifErr?.message);
      }
    }

    if (payment.payerId) {
      try {
        await sendNotification(
          payment.taskId,
          payment.payeeId || payment.payerId,
          payment.payerId,
          'payment_success',
          'Payment Successful!',
          `Your payment of ₹${formattedAmount} for "${taskTitle}" was released to the Buddy.`
        );
      } catch (payerErr) {
        console.warn('Payer payment notification failed:', payerErr?.message);
      }
    }

    return { success: true, payment, heldInEscrow: false };
  } catch (error) {
    console.error('Payment success handling failed:', error);
    throw error;
  }
};

/**
 * Release held escrow payment 100% to the assigned Buddy's wallet
 * Also supports direct payment completion / toggling payment status from Customer or Buddy
 */
export const releaseEscrowForTask = async (taskId, triggeredByUserId = null, options = {}) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        title: true,
        budget: true,
        status: true,
        createdById: true,
        assignedToId: true,
        paymentStatus: true,
      },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    // If explicitly marking as pending/unpaid (e.g. Buddy toggling payment received off)
    if (options.markAsPaid === false) {
      await prisma.task.update({
        where: { id: taskId },
        data: { paymentStatus: 'PENDING' },
      });
      return { released: false, paymentStatus: 'PENDING', message: 'Task payment marked as pending' };
    }

    const heldPayment = await prisma.payment.findFirst({
      where: {
        taskId,
        status: 'HELD_IN_ESCROW',
      },
      orderBy: { createdAt: 'desc' },
    });

    const payeeId = task.assignedToId || heldPayment?.payeeId || null;
    const methodLabel = options.method || heldPayment?.method || 'UPI';

    if (!heldPayment) {
      // Only create a direct completed payment when explicitly triggered via Pay & Release / Mark Payment Received
      if (!options.markAsPaid) {
        return { released: false, message: 'No held escrow payment found for this task' };
      }

      // Check if already completed/released
      const existingCompleted = await prisma.payment.findFirst({
        where: {
          taskId,
          status: { in: ['COMPLETED', 'RELEASED'] },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existingCompleted) {
        await prisma.task.update({
          where: { id: taskId },
          data: { paymentStatus: 'COMPLETED' },
        });
        return { released: true, payment: existingCompleted, paymentStatus: 'COMPLETED' };
      }

      // Create & complete payment record directly so DB is 100% in sync
      // Note: task.budget may be stored in rupees (e.g. 500) or paise; if < 100000 we treat budget as rupees for wallet paise or match createPaymentOrder convention
      const rawBudget = Number(task.budget || 0);
      const amountPaise = rawBudget > 0 ? Math.round(rawBudget * 100) : 0;
      const targetPayeeId = payeeId || triggeredByUserId || task.createdById;

      const createdPayment = await prisma.$transaction(async (tx) => {
        const p = await tx.payment.create({
          data: {
            taskId,
            payerId: task.createdById,
            payeeId: targetPayeeId,
            amount: amountPaise,
            method: methodLabel,
            razorpayOrderId: `direct_${taskId.slice(0, 8)}_${Date.now()}`,
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });

        await tx.task.update({
          where: { id: taskId },
          data: { paymentStatus: 'COMPLETED' },
        });

        if (payeeId && amountPaise > 0) {
          await tx.user.update({
            where: { id: payeeId },
            data: { walletBalance: { increment: amountPaise } },
          });
        }

        return p;
      });

      if (payeeId && amountPaise > 0) {
        const formattedDirect = (amountPaise / 100).toFixed(2);
        try {
          await notificationEvents.paymentReceived(
            taskId,
            payeeId,
            task.createdById,
            amountPaise
          );
          emitToUser(payeeId, 'payment_notification', {
            taskId,
            amount: amountPaise,
            status: 'COMPLETED',
            message: `Payment of ₹${formattedDirect} (100% payout via ${methodLabel}) credited to your wallet!`,
          });
        } catch (e) {
          console.warn('Direct payment notification warning:', e?.message);
        }
      }

      return { released: true, payment: createdPayment, paymentStatus: 'COMPLETED' };
    }

    if (!payeeId) {
      throw new Error('Cannot release escrow payment before a Buddy is assigned to the task');
    }

    const updatedPayment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id: heldPayment.id },
        data: {
          payeeId,
          method: methodLabel,
          status: 'RELEASED',
          completedAt: new Date(),
        },
      });

      await tx.task.update({
        where: { id: taskId },
        data: { paymentStatus: 'COMPLETED' },
      });

      // 100% of task payment goes directly to the Buddy's wallet (0% task commission)
      await tx.user.update({
        where: { id: payeeId },
        data: { walletBalance: { increment: heldPayment.amount } },
      });

      return p;
    });

    const formattedAmount = (heldPayment.amount / 100).toFixed(2);

    try {
      await notificationEvents.paymentReceived(
        taskId,
        payeeId,
        heldPayment.payerId,
        heldPayment.amount
      );
      emitToUser(payeeId, 'payment_notification', {
        taskId,
        amount: heldPayment.amount,
        status: 'RELEASED',
        message: `Escrow released! ₹${formattedAmount} (100% payout) added to your wallet.`,
      });
      await sendNotification(
        taskId,
        payeeId,
        heldPayment.payerId,
        'escrow_released',
        'Escrow Payment Released',
        `₹${formattedAmount} held in escrow for "${task.title}" has been released to your Buddy.`
      );
    } catch (e) {
      console.warn('Escrow release notification warning:', e?.message);
    }

    return { released: true, payment: updatedPayment };
  } catch (error) {
    console.error('Escrow release failed:', error);
    throw error;
  }
};

export const PARTNER_SUBSCRIPTION_PLANS = {
  DAILY: {
    planType: 'DAILY',
    label: 'Daily Active Pass',
    amountPaise: 500, // ₹5/day
    priceRupees: 5,
    days: 1,
    description: 'Keep your Buddy account active for 24 hours and keep 100% of all task earnings.',
  },
  MONTHLY: {
    planType: 'MONTHLY',
    label: 'Monthly Active Pass',
    amountPaise: 9900, // ₹99/month (~₹3.3/day)
    priceRupees: 99,
    days: 30,
    description: 'Keep your Buddy account active for 30 days at ₹3.30/day and keep 100% of all task earnings.',
  },
};

/**
 * Get Partner Subscription Status
 */
export const getPartnerSubscriptionStatus = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      role: true,
      walletBalance: true,
      partnerPlanType: true,
      subscriptionActiveUntil: true,
      partnerSubscriptions: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const now = new Date();
  const isActive =
    user.subscriptionActiveUntil && new Date(user.subscriptionActiveUntil) > now;

  return {
    isActive: Boolean(isActive),
    partnerPlanType: user.partnerPlanType || null,
    subscriptionActiveUntil: user.subscriptionActiveUntil || null,
    walletBalance: user.walletBalance || 0,
    plans: PARTNER_SUBSCRIPTION_PLANS,
    history: user.partnerSubscriptions || [],
  };
};

/**
 * Activate Partner Daily (₹5) or Monthly (₹99) Subscription Pass
 */
export const activatePartnerSubscription = async (
  userId,
  planType = 'DAILY',
  paymentMethod = 'ONLINE',
  razorpayPaymentId = null
) => {
  const normalizedPlan = String(planType || 'DAILY').toUpperCase();
  const plan = PARTNER_SUBSCRIPTION_PLANS[normalizedPlan] || PARTNER_SUBSCRIPTION_PLANS.DAILY;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      walletBalance: true,
      subscriptionActiveUntil: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (paymentMethod === 'WALLET' && (user.walletBalance || 0) < plan.amountPaise) {
    throw new Error(
      `Insufficient wallet balance (₹${((user.walletBalance || 0) / 100).toFixed(2)}). Please choose Online/UPI payment to activate your ₹${plan.priceRupees} pass.`
    );
  }

  const now = new Date();
  const baseDate =
    user.subscriptionActiveUntil && new Date(user.subscriptionActiveUntil) > now
      ? new Date(user.subscriptionActiveUntil)
      : now;

  const expiresAt = new Date(baseDate.getTime() + plan.days * 24 * 60 * 60 * 1000);

  const result = await prisma.$transaction(async (tx) => {
    const sub = await tx.partnerSubscription.create({
      data: {
        userId,
        planType: plan.planType,
        amountPaise: plan.amountPaise,
        daysGranted: plan.days,
        startsAt: now,
        expiresAt,
        paymentMethod,
        razorpayPaymentId: razorpayPaymentId || `sub_pay_${Date.now()}`,
        status: 'ACTIVE',
      },
    });

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        partnerPlanType: plan.planType,
        subscriptionActiveUntil: expiresAt,
        ...(paymentMethod === 'WALLET'
          ? { walletBalance: { decrement: plan.amountPaise } }
          : {}),
      },
      select: {
        id: true,
        walletBalance: true,
        partnerPlanType: true,
        subscriptionActiveUntil: true,
      },
    });

    return { subscription: sub, user: updatedUser };
  });

  return {
    success: true,
    isActive: true,
    plan,
    subscription: result.subscription,
    subscriptionActiveUntil: result.user.subscriptionActiveUntil,
    walletBalance: result.user.walletBalance,
  };
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
  releaseEscrowForTask,
  getPartnerSubscriptionStatus,
  activatePartnerSubscription,
  handlePaymentFailure,
  getPaymentHistory,
  getPaymentDetails,
  refundPayment,
};
