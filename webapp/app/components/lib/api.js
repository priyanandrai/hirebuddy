const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function sendOtpApi(phone) {
  const res = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to send OTP");
  return data;
}

export async function verifyOtpApi(phone, otp) {
  const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, otp }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Invalid or expired OTP");
  return data;
}

export const googleBackendLogin = async (session) => {
  const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
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
};
export async function manualSignup(payload) {
  const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
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