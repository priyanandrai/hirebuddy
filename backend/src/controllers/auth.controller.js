import {
    sendOtpService,
    verifyOtpService,
    googleAuthService
  } from "../services/auth.service.js";
  import prisma from "../utils/prisma.js";
  import bcrypt from "bcrypt";
  import { signUserToken } from "../utils/jwt.js";
  import { indexHelper } from "../services/es.client.js";


  
  export const sendOtp = async (req, res) => {
    try {
      const { phone } = req.body;
      await sendOtpService(phone);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  };
  
  export const verifyOtp = async (req, res) => {
    try {
      const { phone, otp } = req.body;
      const data = await verifyOtpService(phone, otp);
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
    const { name, email, phone, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: "USER",
      },
    });

    // Issue JWT
    const token = signUserToken(user);

    res.status(201).json({
      message: "Signup successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.log("signup eror", error);
    
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
    const { city, skills, experience } = req.body;

    const helper = await prisma.user.update({
      where: { id: userId },
      data: {
        role: "HELPER",
        city,
        skills,
        experience,
      },
    });

    res.json({
      message: "You are now a helper",
      helper,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create helper" });
  }
};

/**
 * Public Helper Registration (e.g. from /become-a-helper)
 */
export const registerHelperPublic = async (req, res) => {
  try {
    const { firstName, lastName, name, phone, password, city, services, skills, hourlyRate, idDocumentUrl } = req.body;

    const rawPhone = String(phone || "").trim();
    const cleanPhone = rawPhone.replace(/\D/g, "").slice(-10);

    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({ message: "A valid 10-digit mobile number is required" });
    }

    const enteredName = (name || `${firstName || ''} ${lastName || ''}`).trim() || "Helper Partner";
    const skillsString = skills || (Array.isArray(services) ? services.join(", ") : (services || ""));
    const helperCity = city || "Modipuram, Meerut";

    let hashedPassword = null;
    if (password && String(password).trim().length >= 4) {
      hashedPassword = await bcrypt.hash(String(password).trim(), 10);
    }

    let user = await prisma.user.findFirst({
      where: { phone: cleanPhone },
    });

    if (user) {
      const updateData = {
        role: "HELPER",
        name: enteredName || user.name,
        city: city || user.city,
        skills: skillsString || user.skills,
      };
      if (hashedPassword) {
        updateData.password = hashedPassword;
      }
      if (hourlyRate) {
        updateData.hourlyRate = Number(hourlyRate) * 100;
      }
      if (idDocumentUrl) {
        updateData.idDocumentUrl = idDocumentUrl;
        updateData.idVerificationStatus = "PENDING";
      }
      user = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
    } else {
      const email = `${cleanPhone}@hirebuddy.local`;
      const createData = {
        name: enteredName,
        phone: cleanPhone,
        email,
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
      user = await prisma.user.create({
        data: createData,
      });
    }

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
    console.error("registerHelperPublic error:", error);
    return res.status(500).json({ message: "Failed to register helper: " + error.message });
  }
};

