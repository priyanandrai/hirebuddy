/**
 * Abstract Payment Gateway & Route Settlement Provider Interface
 * Every concrete payment gateway adapter (Razorpay Route, Cashfree Easy Split) must implement these methods.
 */
export class PaymentGatewayInterface {
  constructor(providerCode) {
    this.providerCode = providerCode;
  }

  async createOrder(_params) {
    throw new Error(`${this.providerCode}.createOrder() not implemented`);
  }

  async fetchPayment(_gatewayPaymentId) {
    throw new Error(`${this.providerCode}.fetchPayment() not implemented`);
  }

  verifyPaymentSignature(_params) {
    throw new Error(`${this.providerCode}.verifyPaymentSignature() not implemented`);
  }

  verifyWebhookSignature(_rawBody, _signature, _secret) {
    throw new Error(`${this.providerCode}.verifyWebhookSignature() not implemented`);
  }

  async initiateTransfer(_params) {
    throw new Error(`${this.providerCode}.initiateTransfer() not implemented`);
  }

  async releaseTransferHold(_gatewayTransferId) {
    throw new Error(`${this.providerCode}.releaseTransferHold() not implemented`);
  }

  async fetchTransfer(_gatewayTransferId) {
    throw new Error(`${this.providerCode}.fetchTransfer() not implemented`);
  }

  async processRefund(_params) {
    throw new Error(`${this.providerCode}.processRefund() not implemented`);
  }

  async reverseTransfer(_params) {
    throw new Error(`${this.providerCode}.reverseTransfer() not implemented`);
  }

  async fetchSettlement(_gatewaySettlementId) {
    throw new Error(`${this.providerCode}.fetchSettlement() not implemented`);
  }
}
