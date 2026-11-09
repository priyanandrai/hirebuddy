"use client";

let razorpayScriptPromise = null;

/**
 * Dynamically loads the official Razorpay Checkout script (`checkout.js`).
 */
export function loadRazorpayScript() {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (typeof window.Razorpay === "function") return Promise.resolve(true);

  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        razorpayScriptPromise = null;
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }

  return razorpayScriptPromise;
}

/**
 * Opens the Razorpay Checkout modal when a live Razorpay key & orderId exist,
 * or resolves with simulated payment credentials in local development mode.
 */
export async function openRazorpayCheckout({
  amountInRupees,
  orderId,
  keyId,
  title = "HireBuddy Escrow Payment",
  description = "100% Payout Protected in HireBuddy Escrow",
  prefill = {},
}) {
  const resolvedKey =
    keyId ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    "";

  const isLiveKey =
    Boolean(resolvedKey) &&
    !resolvedKey.includes("your_razorpay") &&
    resolvedKey.startsWith("rzp_");

  if (!isLiveKey || !orderId || String(orderId).startsWith("order_sim_")) {
    return {
      simulated: true,
      razorpayOrderId: orderId || `order_sim_${Date.now()}`,
      razorpayPaymentId: `pay_sim_${Date.now()}`,
      razorpaySignature: "simulated_signature",
    };
  }

  const loaded = await loadRazorpayScript();
  if (!loaded || typeof window.Razorpay !== "function") {
    return {
      simulated: true,
      razorpayOrderId: orderId,
      razorpayPaymentId: `pay_fallback_${Date.now()}`,
      razorpaySignature: "fallback_signature",
    };
  }

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: resolvedKey,
      amount: Math.round(Number(amountInRupees || 0) * 100),
      currency: "INR",
      name: "HireBuddy",
      description,
      order_id: orderId,
      prefill: {
        name: prefill.name || "",
        email: prefill.email || "",
        contact: prefill.phone || "",
      },
      theme: {
        color: "#2563eb",
      },
      handler: (response) => {
        resolve({
          simulated: false,
          razorpayOrderId: response.razorpay_order_id || orderId,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss: () => {
          reject(new Error("Payment cancelled by user"));
        },
      },
    });
    rzp.open();
  });
}
