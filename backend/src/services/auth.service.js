import prisma from "../utils/prisma.js";
import { signUserToken } from "../utils/jwt.js";
import {
  normalizePhone,
  normalizeEmail,
  resolveFallbackEmail,
  parseDuplicateError,
} from "../utils/userValidation.js";

const normalizeIdentifier = (raw) => {
  const trimmed = String(raw || "").trim();
  if (trimmed.includes("@")) {
    const { cleanEmail } = normalizeEmail(trimmed);
    return { type: "email", value: cleanEmail || "", lookupVariants: [] };
  }
  const { cleanPhone, lookupVariants } = normalizePhone(trimmed);
  return { type: "phone", value: cleanPhone || "", lookupVariants };
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
    const { type, value, lookupVariants } = normalizeIdentifier(identifier);
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
          : {
              OR: (lookupVariants.length > 0 ? lookupVariants : [value]).map(
                (p) => ({ phone: p })
              ),
            },
    });

    if (!user) {
      const fallbackEmail =
        type === "phone" ? await resolveFallbackEmail(value) : null;
      try {
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
                  email: fallbackEmail,
                  name: `User ${value.slice(-4)}`,
                  role: "USER",
                },
        });
      } catch (createErr) {
        const duplicate = parseDuplicateError(createErr);
        if (duplicate.isDuplicate) {
          throw new Error(duplicate.message);
        }
        throw createErr;
      }
    } else if (user.isBlocked) {
      throw new Error(
        user.blockedReason
          ? `Account blocked by administrator: ${user.blockedReason}`
          : "Your account has been blocked by the administrator."
      );
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
  const { cleanEmail, isValid } = normalizeEmail(email);
  if (!cleanEmail || !isValid) {
    throw new Error("A valid email is required");
  }

  try {
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          name,
          image,
          role: null, // role selection pending
        },
      });
    } else if (user.isBlocked) {
      const blockedErr = new Error(
        user.blockedReason
          ? `Account blocked by administrator: ${user.blockedReason}`
          : "Your account has been blocked by the administrator."
      );
      blockedErr.isBlockedError = true;
      throw blockedErr;
    }

    const token = signUserToken(user);

    return { token, user };
  } catch (err) {
    if (err?.isBlockedError) {
      throw err;
    }
    const duplicate = parseDuplicateError(err);
    if (duplicate.isDuplicate) {
      throw new Error(duplicate.message);
    }
    console.error("googleAuthService error:", err);
    throw new Error("Google authentication failed. Please try again later.");
  }
};

