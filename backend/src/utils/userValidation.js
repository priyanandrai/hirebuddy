import prisma from "./prisma.js";

export class DuplicateUserError extends Error {
  constructor(message, field = "unknown") {
    super(message);
    this.name = "DuplicateUserError";
    this.statusCode = 409;
    this.duplicateField = field;
  }
}

/**
 * Normalize an Indian / 10-digit phone number and build lookup variants
 * so legacy formatted phone numbers (e.g. "+919876543210", "09876543210") are also matched.
 */
export const normalizePhone = (rawPhone) => {
  const trimmed = String(rawPhone ?? "").trim();
  if (!trimmed) {
    return { cleanPhone: null, isValid: false, lookupVariants: [] };
  }

  const digits = trimmed.replace(/\D/g, "");
  let cleanPhone = digits;

  if (digits.length === 12 && digits.startsWith("91")) {
    cleanPhone = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    cleanPhone = digits.slice(1);
  }

  const isValid = /^\d{10}$/.test(cleanPhone);
  const lookupVariants = Array.from(
    new Set(
      [
        cleanPhone,
        ...(cleanPhone
          ? [`+91${cleanPhone}`, `91${cleanPhone}`, `0${cleanPhone}`]
          : []),
        trimmed,
      ].filter(Boolean)
    )
  );

  return { cleanPhone: cleanPhone || null, isValid, lookupVariants };
};

/**
 * Normalize email address (trimmed + lowercased). Empty strings become null
 * so optional emails never violate unique constraints on "".
 */
export const normalizeEmail = (rawEmail) => {
  const trimmed = String(rawEmail ?? "").trim().toLowerCase();
  if (!trimmed) {
    return { cleanEmail: null, isValid: true };
  }
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  return { cleanEmail: trimmed, isValid };
};

/**
 * Assert that neither email nor phone already belongs to another User/Helper/Seller/Admin.
 * Throws DuplicateUserError (statusCode = 409) when a match is found.
 */
export const assertUniqueEmailAndPhone = async ({
  email,
  phone,
  excludeUserId = null,
  tx = prisma,
} = {}) => {
  const { cleanEmail, isValid: emailValid } = normalizeEmail(email);
  if (cleanEmail && !emailValid) {
    const err = new Error("Please enter a valid email address.");
    err.statusCode = 400;
    throw err;
  }

  const hasPhoneInput =
    phone !== undefined && phone !== null && String(phone).trim() !== "";
  const {
    cleanPhone,
    isValid: phoneValid,
    lookupVariants,
  } = normalizePhone(phone);

  if (hasPhoneInput && !phoneValid) {
    const err = new Error("Please enter a valid 10-digit mobile number.");
    err.statusCode = 400;
    throw err;
  }

  const orConditions = [];
  if (cleanEmail) {
    orConditions.push({ email: cleanEmail });
  }
  if (lookupVariants.length > 0) {
    for (const variant of lookupVariants) {
      orConditions.push({ phone: variant });
    }
  }

  if (orConditions.length === 0) {
    return { cleanEmail, cleanPhone };
  }

  const db = tx || prisma;
  const existingUsers = await db.user.findMany({
    where: {
      OR: orConditions,
      ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
    },
    select: {
      id: true,
      email: true,
      phone: true,
      role: true,
    },
  });

  if (existingUsers.length > 0) {
    const emailExists =
      !!cleanEmail &&
      existingUsers.some(
        (u) => String(u.email ?? "").trim().toLowerCase() === cleanEmail
      );
    const phoneExists =
      !!cleanPhone &&
      existingUsers.some((u) => {
        const storedClean = normalizePhone(u.phone).cleanPhone;
        return (
          storedClean === cleanPhone ||
          lookupVariants.includes(String(u.phone ?? "").trim())
        );
      });

    if (emailExists && phoneExists) {
      throw new DuplicateUserError(
        "An account with this email address and mobile number already exists.",
        "both"
      );
    }
    if (emailExists) {
      throw new DuplicateUserError(
        "An account with this email address already exists.",
        "email"
      );
    }
    if (phoneExists) {
      throw new DuplicateUserError(
        "An account with this mobile number already exists.",
        "phone"
      );
    }
    throw new DuplicateUserError(
      "An account with this email address or mobile number already exists.",
      "unknown"
    );
  }

  return { cleanEmail, cleanPhone };
};

/**
 * Safely resolve `${cleanPhone}@hirebuddy.local` fallback email if unoccupied,
 * or null if another user already holds that placeholder email.
 */
export const resolveFallbackEmail = async (cleanPhone, tx = prisma) => {
  if (!cleanPhone) return null;
  const candidate = `${cleanPhone}@hirebuddy.local`;
  const db = tx || prisma;
  const existing = await db.user.findUnique({
    where: { email: candidate },
    select: { id: true },
  });
  return existing ? null : candidate;
};

/**
 * Convert DuplicateUserError or Prisma P2002 unique constraint race-condition errors
 * into a clean 409 response descriptor.
 */
export const parseDuplicateError = (error) => {
  if (error?.name === "DuplicateUserError" || error?.statusCode === 409) {
    return {
      isDuplicate: true,
      statusCode: 409,
      message: error.message,
    };
  }

  if (error?.code === "P2002") {
    const targetInfo = `${JSON.stringify(error.meta || "")} ${error.message || ""}`.toLowerCase();
    let message =
      "An account with this email address or mobile number already exists.";
    if (targetInfo.includes("email") && targetInfo.includes("phone")) {
      message =
        "An account with this email address and mobile number already exists.";
    } else if (targetInfo.includes("email")) {
      message = "An account with this email address already exists.";
    } else if (targetInfo.includes("phone")) {
      message = "An account with this mobile number already exists.";
    }
    return {
      isDuplicate: true,
      statusCode: 409,
      message,
    };
  }

  return { isDuplicate: false };
};
