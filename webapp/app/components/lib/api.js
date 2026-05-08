const RAW_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const normalizedBase = RAW_API_BASE_URL.trim().replace(/\/+$/, "");
const API_BASE_URL = normalizedBase.endsWith("/api")
  ? normalizedBase
  : `${normalizedBase}/api`;

export async function sendOtpApi(phone) {
  const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to send OTP");
  return data;
}

export async function verifyOtpApi(phone, otp) {
  const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, otp }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Invalid or expired OTP");
  return data;
}

export const googleBackendLogin = async (session) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      }),
    });

    if (!res.ok) {
      throw new Error("Backend Google auth failed");
    }

    return res.json();
  } catch (error) {
    console.error("Google backend login error:", error);
    throw error;
  }
};
export async function manualSignup(payload) {
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Signup failed");
  }

  return data;
}