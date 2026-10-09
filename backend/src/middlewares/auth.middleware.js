import prisma from "../utils/prisma.js";
import { verifyUserToken } from "../utils/jwt.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || "";
    const [scheme, token] = authorization.split(" ");

    const adminToken = req.query?.adminToken || req.body?.adminToken;
    if (
      process.env.ID_VERIFY_TOKEN &&
      (token === process.env.ID_VERIFY_TOKEN || adminToken === process.env.ID_VERIFY_TOKEN)
    ) {
      req.isAdmin = true;
      req.user = { id: "admin", role: "ADMIN", name: "System Admin" };
      return next();
    }

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = verifyUserToken(token);
    const userId = decoded.id || decoded.userId;

    if (!userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("auth middleware error", error);
    return res.status(401).json({ message: "Invalid token" });
  }
};
