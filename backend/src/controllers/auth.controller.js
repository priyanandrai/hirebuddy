import {
    sendOtpService,
    verifyOtpService,
    googleAuthService
  } from "../services/auth.service.js";
  import prisma from "../utils/prisma.js";
  import bcrypt from "bcrypt";
  import { signUserToken } from "../utils/jwt.js";
  import { indexHelper } from "../services/es.client.js";
  import {
    normalizePhone,
    assertUniqueEmailAndPhone,
    resolveFallbackEmail,
    parseDuplicateError,
  } from "../utils/userValidation.js";


  
  export const sendOtp = async (req, res) => {
    try {
      const { phone, email, identifier } = req.body;
      const result = await sendOtpService(phone || email || identifier);
      res.json({
        success: true,
        message: `OTP sent to ${result.identifier}`,
        devOtp: result.otp,
      });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  };
  
  export const verifyOtp = async (req, res) => {
    try {
      const { phone, email, identifier, otp } = req.body;
      const data = await verifyOtpService(phone || email || identifier, otp);
      res.json(data);
    } catch (err) {
      res.status(401).json({ message: err.message });
    }
  };
  
  // ✅ NEW: Google auth
export const googleAuth = async (req, res) => {
    try {
      const user = await googleAuthService(req.body);
      res.json(user);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  };

  /**
 * Manual signup
 */
export const signup = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    const trimmedName = String(name ?? "").trim();
    const trimmedPassword = String(password ?? "").trim();

    if (!trimmedName || !phone || !trimmedPassword) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (trimmedPassword.length < 4) {
      return res
        .status(400)
        .json({ message: "Password must be at least 4 characters long" });
    }

    // Validate format & ensure neither email nor phone already belongs to any account
    const { cleanEmail, cleanPhone } = await assertUniqueEmailAndPhone({
      email,
      phone,
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(trimmedPassword, 10);
    const resolvedRole = ["USER", "HELPER", "SELLER"].includes(role)
      ? role
      : "USER";

    // Create user
    const user = await prisma.user.create({
      data: {
        name: trimmedName,
        email: cleanEmail,
        phone: cleanPhone,
        password: hashedPassword,
        role: resolvedRole,
      },
    });

    if (user.role === "HELPER") {
      try {
        await indexHelper(user);
      } catch (e) {
        console.warn("Index helper on signup failed:", e.message);
      }
    }

    // Issue JWT
    const token = signUserToken(user);

    res.status(201).json({
      success: true,
      message: "Signup successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    const duplicate = parseDuplicateError(error);
    if (duplicate.isDuplicate) {
      return res
        .status(duplicate.statusCode)
        .json({ success: false, message: duplicate.message });
    }
    if (error?.statusCode === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error("signup error", error);
    res.status(500).json({ message: "Signup failed" });
  }
};

export const login = async (req, res) => {
  try {
    const { phone, email, identifier, password } = req.body;
    const rawId = (phone || email || identifier || "").trim();

    if (!rawId || !password) {
      return res.status(400).json({ message: "Mobile number or email, and password are required" });
    }

    // Clean phone number (extract last 10 digits if formatted with +91 or spaces)
    const digitsOnly = rawId.replace(/\D/g, "");
    const cleanPhone = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;

    // Search for user by phone (cleaned or raw) or by email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(cleanPhone ? [{ phone: cleanPhone }, { phone: rawId }] : []),
          { email: rawId.toLowerCase() },
        ],
      },
    });

    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid credentials. Please check your ID and password." });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message: user.blockedReason
          ? `Account blocked by administrator: ${user.blockedReason}`
          : "Your account has been blocked by the administrator.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials. Please check your ID and password." });
    }

    const token = signUserToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        city: user.city,
        skills: user.skills,
        idVerificationStatus: user.idVerificationStatus,
      },
    });
  } catch (error) {
    console.error("Login controller error:", error);
    res.status(500).json({ message: "Login failed. Please try again." });
  }
};

/**
 * Convert logged-in user into HELPER
 */
export const becomeHelper = async (req, res) => {
  try {
    const userId = req.user.id;
    const { city, skills, experience, email, phone } = req.body;

    const updateData = {
      role: "HELPER",
      ...(city !== undefined ? { city } : {}),
      ...(skills !== undefined
        ? { skills: Array.isArray(skills) ? skills.join(", ") : skills }
        : {}),
      ...(experience !== undefined ? { experience: Number(experience) || 0 } : {}),
    };

    if (email !== undefined || phone !== undefined) {
      const { cleanEmail, cleanPhone } = await assertUniqueEmailAndPhone({
        email,
        phone,
        excludeUserId: userId,
      });
      if (cleanEmail) updateData.email = cleanEmail;
      if (cleanPhone) updateData.phone = cleanPhone;
    }

    const helper = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    try {
      await indexHelper(helper);
    } catch (e) {
      console.warn("Index helper failed:", e.message);
    }

    res.json({
      message: "You are now a helper",
      helper,
    });
  } catch (error) {
    const duplicate = parseDuplicateError(error);
    if (duplicate.isDuplicate) {
      return res
        .status(duplicate.statusCode)
        .json({ success: false, message: duplicate.message });
    }
    if (error?.statusCode === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ message: "Failed to create helper" });
  }
};

/**
 * Public Helper Registration (e.g. from /become-a-helper)
 */
export const registerHelperPublic = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      name,
      phone,
      email,
      password,
      city,
      services,
      skills,
      hourlyRate,
      idDocumentUrl,
    } = req.body;

    const { isValid: isValidPhone } = normalizePhone(phone);
    if (!isValidPhone) {
      return res
        .status(400)
        .json({ message: "A valid 10-digit mobile number is required" });
    }

    // Do NOT allow registering a helper with an existing mobile number or email address
    const { cleanEmail, cleanPhone } = await assertUniqueEmailAndPhone({
      email,
      phone,
    });

    const enteredName =
      (name || `${firstName || ""} ${lastName || ""}`).trim() ||
      "Helper Partner";
    const skillsString =
      skills ||
      (Array.isArray(services) ? services.join(", ") : services || "");
    const helperCity = city || "Modipuram, Meerut";

    let hashedPassword = null;
    if (password && String(password).trim().length >= 4) {
      hashedPassword = await bcrypt.hash(String(password).trim(), 10);
    }

    const resolvedEmail =
      cleanEmail || (await resolveFallbackEmail(cleanPhone));

    const createData = {
      name: enteredName,
      phone: cleanPhone,
      email: resolvedEmail,
      city: helperCity,
      role: "HELPER",
      skills: skillsString,
      idDocumentUrl: idDocumentUrl || null,
      idVerificationStatus: idDocumentUrl ? "PENDING" : "UNVERIFIED",
      isAvailable: true,
    };
    if (hashedPassword) {
      createData.password = hashedPassword;
    }
    if (hourlyRate) {
      createData.hourlyRate = Number(hourlyRate) * 100;
    }

    const user = await prisma.user.create({
      data: createData,
    });

    try {
      await indexHelper(user);
    } catch (e) {
      console.warn("Index helper failed:", e.message);
    }

    const token = signUserToken(user);

    return res.status(201).json({
      success: true,
      message: "Helper registered successfully",
      token,
      user,
    });
  } catch (error) {
    const duplicate = parseDuplicateError(error);
    if (duplicate.isDuplicate) {
      return res
        .status(duplicate.statusCode)
        .json({ success: false, message: duplicate.message });
    }
    if (error?.statusCode === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error("registerHelperPublic error:", error);
    return res
      .status(500)
      .json({ message: "Failed to register helper: " + error.message });
  }
};

