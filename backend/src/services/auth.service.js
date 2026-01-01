import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export const sendOtpService = async (phone) => {
  if (!phone || phone.length !== 10) {
    throw new Error("Invalid phone number");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await prisma.otp.create({
    data: {
      phone,
      code: otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });

  // TEMP: log OTP (replace with SMS provider)
  console.log("OTP:", otp);
};

export const verifyOtpService = async (phone, otp) => {
  const record = await prisma.otp.findFirst({
    where: {
      phone,
      code: otp,
      expiresAt: { gt: new Date() },
      verified: false,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) throw new Error("Invalid or expired OTP");

  await prisma.otp.update({
    where: { id: record.id },
    data: { verified: true },
  });

  let user = await prisma.user.findUnique({ where: { phone } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        phone,
        isVerified: true,
      },
    });
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return { token, user };
};

export const googleAuthService = async ({ email, name, image }) => {
  if (!email) {
    throw new Error("Email is required");
  }

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

  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return { token, user };
};

