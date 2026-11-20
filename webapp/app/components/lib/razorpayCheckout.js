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
  amountRupees,
  amountPaise,
  orderId,
  keyId,
  title = "HireBuddy",
  description = "Secure Payment via Razorpay",
  prefill = {},
}) {
  const isRealBackendOrder =
    Boolean(orderId) &&
    String(orderId).startsWith("order_") &&
    !/^(order_sim_|order_mock_|order_escrow_|order_rzp_|order_mkt_)/.test(String(orderId));

  const resolvedKey =
    keyId ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    (isRealBackendOrder ? "rzp_test_U18E0SPXVUzHts" : "");

  const isLiveKey =
    Boolean(resolvedKey) &&
    !resolvedKey.includes("your_razorpay") &&
    !resolvedKey.includes("placeholder") &&
    resolvedKey.startsWith("rzp_");

  const resolvedPaise =
    amountPaise !== undefined && amountPaise !== null
      ? Math.round(Number(amountPaise))
      : Math.round(Number(amountInRupees ?? amountRupees ?? 0) * 100);

  if (!isLiveKey) {
    const simOrderId = orderId || `order_sim_${Date.now()}`;
    const simPaymentId = `pay_sim_${Date.now()}`;
    const simSignature = "simulated_signature";
    return {
      simulated: true,
      razorpayOrderId: simOrderId,
      razorpayPaymentId: simPaymentId,
      razorpaySignature: simSignature,
      razorpay_order_id: simOrderId,
      razorpay_payment_id: simPaymentId,
      razorpay_signature: simSignature,
    };
  }

  if (!orderId || String(orderId).startsWith("order_sim_") || String(orderId).startsWith("order_escrow_")) {
    throw new Error(
      "Could not initialize Razorpay order. Please ensure you are signed in and try again."
    );
  }

  const loaded = await loadRazorpayScript();
  if (!loaded || typeof window.Razorpay !== "function") {
    throw new Error(
      "Unable to load Razorpay Checkout SDK. Please check your internet connection and retry."
    );
  }

  let storedUser = null;
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("user");
      if (raw) storedUser = JSON.parse(raw);
    } catch {}
  }

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: resolvedKey,
      amount: resolvedPaise,
      currency: "INR",
      name: title || "HireBuddy",
      description,
      order_id: orderId,
      prefill: {
        name: prefill.name || storedUser?.name || "",
        email: prefill.email || storedUser?.email || "",
        contact: prefill.phone || prefill.contact || storedUser?.phone || "",
      },
      theme: {
        color: "#2563eb",
      },
      handler: (response) => {
        const finalOrderId = response.razorpay_order_id || orderId;
        const finalPaymentId = response.razorpay_payment_id;
        const finalSignature = response.razorpay_signature;
        resolve({
          simulated: false,
          razorpayOrderId: finalOrderId,
          razorpayPaymentId: finalPaymentId,
          razorpaySignature: finalSignature,
          razorpay_order_id: finalOrderId,
          razorpay_payment_id: finalPaymentId,
          razorpay_signature: finalSignature,
        });
      },
      modal: {
        ondismiss: () => {
          reject(new Error("Payment cancelled by user"));
        },
      },
    });
    rzp.on("payment.failed", (resp) => {
      const desc =
        resp?.error?.description ||
        resp?.error?.reason ||
        "Payment failed in Razorpay Checkout. Please try again.";
      reject(new Error(desc));
    });
    rzp.open();
  });
}
