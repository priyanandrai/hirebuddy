import jwt from "jsonwebtoken";
import prisma from "../utils/prisma.js";

export const authMiddleware = async (req, res, next) => {
  try {
   
    // const token = req.headers.authorization?.split(" ")[1];

    // if (!token) {
    //   return res.status(401).json({ message: "Unauthorized" });
    // }

    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
const user = {id:"7b569ad4-9c5c-475a-b569-3d9acfedde9f"}
    // const user = await prisma.user.findUnique({
    //   where: { id: decoded.id },
    // });

    // if (!user) {
    //   return res.status(401).json({ message: "User not found" });
    // }

     req.user = user || {id:"7b569ad4-9c5c-475a-b569-3d9acfedde9f"}; // FULL user from DB
    // next();
    next();
  } catch (error) {
    console.log("create task error", error);
    
    return res.status(401).json({ message: "Invalid token" });
  }
};
