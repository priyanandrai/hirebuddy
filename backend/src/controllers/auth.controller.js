import {
    sendOtpService,
    verifyOtpService,
    googleAuthService
  } from "../services/auth.service.js";
  import prisma from "../utils/prisma.js";
  import bcrypt from "bcrypt";
  import jwt from "jsonwebtoken";


  
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
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

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
  const { phone, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { phone },
  });

  if (!user || !user.password) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token, user });
};

/**
 * Convert logged-in user into HELPER
 */
export const becomeHelper = async (req, res) => {
  try {
    const userId = req.user.id;
    const { city, skills, hourlyRate } = req.body;

    const helper = await prisma.user.update({
      where: { id: userId },
      data: {
        role: "HELPER",
        city,
        skills,
        hourlyRate,
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

