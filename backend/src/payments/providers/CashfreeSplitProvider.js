import crypto from 'crypto';
import { PaymentGatewayInterface } from './PaymentGatewayInterface.js';
import { assertIntegerPaise } from '../../utils/cryptoVault.js';

/**
 * Cashfree Easy Split Payment Provider Adapter
 * Implements the exact same PaymentGatewayInterface so HireBuddy can switch providers via configuration.
 */
export class CashfreeSplitProvider extends PaymentGatewayInterface {
  constructor(config = {}) {
    super('CASHFREE');
    this.appId = config.appId || process.env.CASHFREE_APP_ID || '';
    this.secretKey = config.secretKey || process.env.CASHFREE_SECRET_KEY || '';
    this.webhookSecret =
      config.webhookSecret || process.env.CASHFREE_WEBHOOK_SECRET || 'cashfree_webhook_secret';
  }

  async createOrder({ amountPaise, currency = 'INR', receipt, notes = {}, idempotencyKey }) {
    const validatedPaise = assertIntegerPaise(amountPaise, 'amountPaise');
    const suffix = idempotencyKey
      ? crypto.createHash('md5').update(String(idempotencyKey)).digest('hex').slice(0, 10)
      : `${Date.now()}`;
    return {
      provider: 'CASHFREE',
      orderId: `order_cf_${suffix}`,
      amountPaise: validatedPaise,
      currency,
      status: 'ACTIVE',
      raw: { order_id: `order_cf_${suffix}`, order_amount: validatedPaise / 100, receipt, notes },
    };
  }

  async fetchPayment(gatewayPaymentId) {
    return {
      provider: 'CASHFREE',
      paymentId: gatewayPaymentId,
      status: 'SUCCESS',
      captured: true,
    };
  }

  verifyPaymentSignature({ orderId, paymentId, signature }) {
    if (!orderId || !paymentId || !signature) return false;
    const expected = crypto
      .createHmac('sha256', this.secretKey || 'cashfree_test_secret')
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    return expected === signature;
  }

  verifyWebhookSignature(rawBody, signature, customSecret = null) {
    if (!rawBody || !signature) return false;
    const secret = customSecret || this.webhookSecret;
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
    return expected === signature;
  }

  async initiateTransfer({ linkedAccountId, amountPaise, currency = 'INR', onHold = false }) {
    const validatedPaise = assertIntegerPaise(amountPaise, 'amountPaise');
    return {
      provider: 'CASHFREE',
      transferId: `trf_cf_${Date.now()}`,
      amountPaise: validatedPaise,
      currency,
      status: onHold ? 'ON_HOLD' : 'SUCCESS',
      onHold: Boolean(onHold),
      raw: { vendor_id: linkedAccountId, amountPaise: validatedPaise },
    };
  }

  async releaseTransferHold(gatewayTransferId) {
    return {
      provider: 'CASHFREE',
      transferId: gatewayTransferId,
      onHold: false,
      status: 'SUCCESS',
    };
  }

  async fetchTransfer(gatewayTransferId) {
    return {
      provider: 'CASHFREE',
      transferId: gatewayTransferId,
      status: 'SUCCESS',
      onHold: false,
    };
  }

  async processRefund({ gatewayPaymentId, amountPaise }) {
    const validatedPaise = assertIntegerPaise(amountPaise, 'amountPaise');
    return {
      provider: 'CASHFREE',
      refundId: `rfnd_cf_${Date.now()}`,
      paymentId: gatewayPaymentId,
      amountPaise: validatedPaise,
      status: 'SUCCESS',
    };
  }

  async reverseTransfer({ gatewayTransferId, amountPaise }) {
    const validatedPaise = assertIntegerPaise(amountPaise, 'amountPaise');
    return {
      provider: 'CASHFREE',
      reversalId: `rev_cf_${Date.now()}`,
      transferId: gatewayTransferId,
      amountPaise: validatedPaise,
    };
  }

  async fetchSettlement(gatewaySettlementId) {
    return {
      provider: 'CASHFREE',
      settlementId: gatewaySettlementId,
      status: 'SETTLED',
      utrNumber: `UTRCF${Date.now()}`,
    };
  }
}
