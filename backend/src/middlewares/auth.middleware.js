import jwt from "jsonwebtoken";
import prisma from "../utils/prisma.js";

export const authMiddleware = async (req, res, next) => {
  try {
    next();
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user; // FULL user from DB
    // next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
