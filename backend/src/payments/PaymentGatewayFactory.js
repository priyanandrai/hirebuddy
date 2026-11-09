import { RazorpayRouteProvider } from './providers/RazorpayRouteProvider.js';
import { CashfreeSplitProvider } from './providers/CashfreeSplitProvider.js';

const instances = new Map();

/**
 * PaymentGatewayFactory
 * Returns the configured payment gateway provider (Razorpay Route by default, or Cashfree Easy Split).
 */
export function getPaymentGateway(providerCode = null, customConfig = {}) {
  const code = String(
    providerCode || process.env.PAYMENT_PROVIDER || 'RAZORPAY'
  )
    .trim()
    .toUpperCase();

  const cacheKey = `${code}_${JSON.stringify(customConfig)}`;
  if (instances.has(cacheKey)) {
    return instances.get(cacheKey);
  }

  let provider;
  if (code === 'CASHFREE') {
    provider = new CashfreeSplitProvider(customConfig);
  } else {
    provider = new RazorpayRouteProvider(customConfig);
  }

  instances.set(cacheKey, provider);
  return provider;
}

export default { getPaymentGateway };
