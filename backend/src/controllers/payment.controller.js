import * as paymentService from '../services/payment.service.js';
import { getPaymentGateway } from '../payments/PaymentGatewayFactory.js';
import {
  createMarketplacePaymentOrder,
  finalizeCapturedMarketplacePayment,
  processRazorpayWebhook,
  getBookingPaymentDetails,
} from '../services/marketplacePayment.service.js';
import { calculateCompleteBookingBreakdown } from '../services/pricingBreakdown.service.js';
import { processMarketplaceRefund } from '../services/refundEngine.service.js';
import { processHelperPayoutForBooking } from '../services/payout.service.js';

/**
 * Calculate Complete Customer & Helper Price Breakdown (Commission, GST, Sec 52 TCS, Sec 194-O TDS)
 * POST /api/payments/calculate-breakdown
 */
export const calculatePaymentBreakdown = async (req, res) => {
  try {
    const {
      serviceCategory = 'General Service',
      baseServicePaise,
      amount,
      helperId = null,
      customerStateCode = 'UP',
      helperStateCode = null,
      promoCode = null,
      discountPaise = 0,
      discountFundedBy = 'NONE',
      commissionGstMode = 'INCLUSIVE',
    } = req.body;

    const resolvedBasePaise =
      baseServicePaise !== undefined && baseServicePaise !== null
        ? Number(baseServicePaise)
        : Number(amount || 0);

    if (!Number.isInteger(resolvedBasePaise) || resolvedBasePaise <= 0) {
      return res.status(400).json({
        error: 'baseServicePaise (integer paise > 0) is required',
      });
    }

    const breakdown = await calculateCompleteBookingBreakdown({
      serviceCategory,
      baseServicePaise: resolvedBasePaise,
      helperId,
      customerId: req.user?.id || null,
      customerStateCode,
      helperStateCode,
      promoCode,
      discountPaise: Number(discountPaise || 0),
      discountFundedBy,
      commissionGstMode,
    });

    res.json({
      success: true,
      breakdown,
    });
  } catch (error) {
    console.error('Calculate payment breakdown error:', error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Create payment order (Razorpay / Cashfree via PaymentGatewayFactory + Tax & Commission Engine)
 * POST /api/payments/create-order
 */
export const createPaymentOrder = async (req, res) => {
  try {
    const {
      taskId,
      bookingId,
      amount,
      amountPaise,
      amountRupees,
      baseServicePaise,
      purpose = 'TASK_ESCROW',
      payeeId,
      promoCode = null,
      discountPaise = 0,
      discountFundedBy = 'NONE',
      customerStateCode = 'UP',
      helperStateCode = null,
      commissionGstMode = 'INCLUSIVE',
      idempotencyKey = null,
      providerCode = 'RAZORPAY',
      notes = {},
    } = req.body;

    const resolvedTaskId = taskId || bookingId;
    const userId = req.user.id;

    // Standalone Razorpay Order (Marketplace Product/Service Order, Wallet Top-up, Buddy Subscription Pass)
    if (!resolvedTaskId) {
      const standalonePaise =
        amountPaise !== undefined && amountPaise !== null
          ? Math.round(Number(amountPaise))
          : baseServicePaise !== undefined && baseServicePaise !== null
            ? Math.round(Number(baseServicePaise))
            : amountRupees !== undefined && amountRupees !== null
              ? Math.round(Number(amountRupees) * 100)
              : amount !== undefined && amount !== null
                ? Math.round(Number(amount) * 100)
                : 0;

      if (!standalonePaise || standalonePaise <= 0) {
        return res.status(400).json({
          error: 'taskId (or positive amountRupees / amountPaise) is required',
        });
      }

      const gateway = getPaymentGateway(providerCode);
      const resolvedIdempKey =
        idempotencyKey ||
        req.headers['idempotency-key'] ||
        `hb_${String(purpose || 'ord').toLowerCase().slice(0, 8)}_${userId.slice(0, 8)}_${Date.now()}`;

      const gatewayOrder = await gateway.createOrder({
        amountPaise: standalonePaise,
        currency: 'INR',
        receipt: `hb_${String(purpose || 'ord').toLowerCase().slice(0, 6)}_${Date.now()}`.slice(0, 40),
        idempotencyKey: resolvedIdempKey,
        notes: {
          ...notes,
          userId,
          purpose: String(purpose || 'MARKETPLACE_ORDER'),
        },
      });

      return res.json({
        success: true,
        provider: gatewayOrder.provider,
        keyId: gatewayOrder.keyId || process.env.RAZORPAY_KEY_ID || null,
        orderId: gatewayOrder.orderId,
        amount: gatewayOrder.amountPaise,
        amountPaise: gatewayOrder.amountPaise,
        amountRupees: Number((gatewayOrder.amountPaise / 100).toFixed(2)),
        currency: gatewayOrder.currency || 'INR',
        purpose,
      });
    }

    const resolvedBasePaise =
      baseServicePaise !== undefined && baseServicePaise !== null
        ? Math.round(Number(baseServicePaise))
        : amountPaise !== undefined && amountPaise !== null
          ? Math.round(Number(amountPaise))
          : amountRupees !== undefined && amountRupees !== null
            ? Math.round(Number(amountRupees) * 100)
            : amount !== undefined && amount !== null
              ? Math.round(Number(amount))
              : null;

    const result = await createMarketplacePaymentOrder({
      taskId: resolvedTaskId,
      payerId: userId,
      payeeId: payeeId || null,
      baseServicePaise: resolvedBasePaise,
      promoCode,
      discountPaise: Math.round(Number(discountPaise || 0)),
      discountFundedBy,
      customerStateCode,
      helperStateCode,
      commissionGstMode,
      idempotencyKey: idempotencyKey || req.headers['idempotency-key'] || null,
      providerCode,
    });

    res.json(result);
  } catch (error) {
    console.error('Payment order creation error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Verify and handle payment success
 * POST /api/payments/verify
 */
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
      paymentId,
      signature,
    } = req.body;

    const resolvedOrderId = razorpay_order_id || orderId;
    const resolvedPaymentId = razorpay_payment_id || paymentId;
    const resolvedSignature = razorpay_signature || signature;

    if (!resolvedOrderId || !resolvedPaymentId || !resolvedSignature) {
      return res.status(400).json({ error: 'Missing payment verification details' });
    }

    const result = await finalizeCapturedMarketplacePayment({
      razorpayOrderId: resolvedOrderId,
      razorpayPaymentId: resolvedPaymentId,
      razorpaySignature: resolvedSignature,
      verifySignature: true,
    });

    res.json({
      success: result.success,
      alreadyProcessed: result.alreadyProcessed || false,
      payment: result.payment,
      taxTransaction: result.taxTransaction || null,
      taxWithholding: result.taxWithholding || null,
      helperPayout: result.helperPayout || null,
      invoices: result.invoices || [],
      heldInEscrow: true,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Handle Razorpay Webhook (HMAC-SHA256 Raw Body Signature Verification + Idempotency)
 * POST /api/payments/webhook/razorpay
 */
export const handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const eventId = req.headers['x-razorpay-event-id'] || req.body?.id || null;
    const rawBody = req.rawBody || JSON.stringify(req.body || {});

    const result = await processRazorpayWebhook({
      rawBody,
      signature,
      eventId,
      payload: req.body,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Razorpay webhook error:', error.message);
    const status = error.statusCode || 400;
    res.status(status).json({ error: error.message });
  }
};

/**
 * Release held escrow payment or trigger helper Route payout for a task
 * POST /api/payments/release-escrow
 */
export const releaseEscrowPayment = async (req, res) => {
  try {
    const { taskId, paymentId, method, markAsPaid } = req.body;
    if (!taskId && !paymentId) {
      return res.status(400).json({ error: 'taskId or paymentId is required' });
    }

    if (paymentId) {
      const payoutResult = await processHelperPayoutForBooking({
        paymentId,
        taskId,
        approvedByAdminId: req.isAdmin ? req.user?.id : null,
      });
      return res.json(payoutResult);
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
    const {
      planType = 'DAILY',
      paymentMethod = 'ONLINE',
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = req.body;
    const result = await paymentService.activatePartnerSubscription(
      req.user.id,
      planType,
      paymentMethod,
      {
        razorpayPaymentId: razorpayPaymentId || razorpay_payment_id || null,
        razorpayOrderId: razorpayOrderId || razorpay_order_id || null,
        razorpaySignature: razorpaySignature || razorpay_signature || null,
      }
    );
    res.json(result);
  } catch (error) {
    console.error('Subscription activation error:', error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Get Wallet Overview & Transaction Ledger
 */
export const getWallet = async (req, res) => {
  try {
    const targetUserId =
      req.isAdmin && req.query.userId ? req.query.userId : req.user.id;
    const result = await paymentService.getWalletOverview(targetUserId);
    res.json(result);
  } catch (error) {
    console.error('Wallet overview error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Top up Wallet Balance
 */
export const topupWallet = async (req, res) => {
  try {
    const result = await paymentService.topupWallet(req.user.id, req.body);
    res.json(result);
  } catch (error) {
    console.error('Wallet topup error:', error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Withdraw from Wallet to UPI / Bank
 */
export const withdrawWallet = async (req, res) => {
  try {
    const result = await paymentService.withdrawFromWallet(req.user.id, req.body);
    res.json(result);
  } catch (error) {
    console.error('Wallet withdrawal error:', error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Pay for Task using Wallet Balance
 */
export const payTaskWithWallet = async (req, res) => {
  try {
    const result = await paymentService.payTaskWithWallet(req.user.id, req.body);
    res.json(result);
  } catch (error) {
    console.error('Wallet task payment error:', error);
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
 * Get payment details for a specific booking
 * GET /api/payments/booking/:bookingId
 */
export const getBookingPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const result = await getBookingPaymentDetails(bookingId, req.user?.id, Boolean(req.isAdmin));
    res.json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ error: error.message });
  }
};

/**
 * Get payment details by paymentId (Enforces RBAC: payer, payee, or admin only)
 * GET /api/payments/:paymentId
 */
export const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await paymentService.getPaymentDetails(paymentId);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const userId = req.user?.id;
    const isOwner = payment.payerId === userId || payment.payeeId === userId;
    if (!req.isAdmin && !isOwner) {
      return res.status(403).json({
        error: 'Forbidden: You are not authorized to access this payment record',
      });
    }

    res.json(payment);
  } catch (error) {
    console.error('Payment details fetch error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Process Marketplace Refund (Full, Partial, Cancellation Stage, Post-Payout Recovery)
 * POST /api/payments/refund or POST /api/payments/:paymentId/refund
 */
export const refundPayment = async (req, res) => {
  try {
    const paymentId = req.params.paymentId || req.body.paymentId;
    const {
      reason = 'Customer refund request',
      cancelledByRole = req.isAdmin ? 'ADMIN' : 'CUSTOMER',
      cancellationStage = 'BEFORE_START',
      customRefundPaise = null,
      retainGatewayFee = false,
      idempotencyKey = null,
    } = req.body;

    if (!paymentId) {
      return res.status(400).json({ error: 'paymentId is required' });
    }

    const payment = await paymentService.getPaymentDetails(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // RBAC check: only payer or admin can initiate refund
    if (!req.isAdmin && payment.payerId !== req.user?.id) {
      return res.status(403).json({
        error: 'Forbidden: Only the booking customer or an admin can request a refund',
      });
    }

    const result = await processMarketplaceRefund({
      paymentId,
      requestedById: req.user?.id,
      cancelledByRole,
      cancellationStage,
      customRefundPaise:
        customRefundPaise !== null && customRefundPaise !== undefined
          ? Math.round(Number(customRefundPaise))
          : null,
      retainGatewayFee: Boolean(retainGatewayFee),
      reason,
      idempotencyKey: idempotencyKey || req.headers['idempotency-key'] || null,
    });

    res.json(result);
  } catch (error) {
    console.error('Payment refund error:', error);
    res.status(400).json({ error: error.message });
  }
};

export default {
  calculatePaymentBreakdown,
  createPaymentOrder,
  verifyPayment,
  handleRazorpayWebhook,
  releaseEscrowPayment,
  getSubscriptionStatus,
  activateSubscription,
  getWallet,
  topupWallet,
  withdrawWallet,
  payTaskWithWallet,
  getPaymentHistory,
  getBookingPayment,
  getPaymentDetails,
  refundPayment,
};
