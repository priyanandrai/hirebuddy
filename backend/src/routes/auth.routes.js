import express from "express";
import {
  sendOtp,
  verifyOtp,
  googleAuth,
  signup,         
  becomeHelper,
  login
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
// Google auth (POST-login)
router.post("/google", googleAuth);
// 👇 Manual signup
router.post("/signup", signup);
router.post("/login", login);


// 👇 Become helper (post-login)
router.post("/become-helper", authMiddleware, becomeHelper);

export default router;
