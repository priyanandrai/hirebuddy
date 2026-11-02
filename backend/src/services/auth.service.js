import prisma from "../utils/prisma.js";
import { signUserToken } from "../utils/jwt.js";

const normalizeIdentifier = (raw) => {
  const trimmed = String(raw || "").trim();
  if (trimmed.includes("@")) {
    return { type: "email", value: trimmed.toLowerCase() };
  }
  const digits = trimmed.replace(/\D/g, "");
  const cleanPhone = digits.length >= 10 ? digits.slice(-10) : digits;
  return { type: "phone", value: cleanPhone };
};

export const sendOtpService = async (identifier) => {
  const { type, value } = normalizeIdentifier(identifier);
  if (type === "phone" && (!value || value.length !== 10)) {
    throw new Error("Please enter a valid 10-digit mobile number or email address");
  }
  if (type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new Error("Please enter a valid email address");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await prisma.otp.create({
    data: {
      phone: value,
      code: otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });

  console.log(`[HireBuddy OTP] Identifier: ${value} | OTP: ${otp}`);
  return { otp, identifier: value, type };
};

export const verifyOtpService = async (identifier, otp) => {
  try {
    const { type, value } = normalizeIdentifier(identifier);
    const enteredCode = String(otp || "").trim();

    const record = await prisma.otp.findFirst({
      where: {
        phone: value,
        code: enteredCode,
        expiresAt: { gt: new Date() },
        verified: false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      throw new Error("Invalid or expired OTP. Please check the 6-digit code and try again.");
    }

    await prisma.otp.update({
      where: { id: record.id },
      data: { verified: true },
    });

    let user = await prisma.user.findFirst({
      where:
        type === "email"
          ? { email: value }
          : { OR: [{ phone: value }, { phone: String(identifier || "").trim() }] },
    });

    if (!user) {
      user = await prisma.user.create({
        data:
          type === "email"
            ? {
                email: value,
                name: value.split("@")[0],
                role: "USER",
              }
            : {
                phone: value,
                email: `${value}@hirebuddy.local`,
                name: `User ${value.slice(-4)}`,
                role: "USER",
              },
      });
    }

    const token = signUserToken(user);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role || "USER",
        city: user.city,
        address: user.address,
        skills: user.skills,
        idVerificationStatus: user.idVerificationStatus,
      },
    };
  } catch (err) {
    console.error("verifyOtpService error:", err);
    throw new Error(err.message || "Authentication failed. Please try again.");
  }
};

export const googleAuthService = async ({ email, name, image }) => {
  if (!email) {
    throw new Error("Email is required");
  }

  try {
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          image,
          role: null, // role selection pending
        },
      });
    }

    const token = signUserToken(user);

    return { token, user };
  } catch (err) {
    console.error('googleAuthService error:', err);
    throw new Error('Google authentication failed. Please try again later.');
  }
};

