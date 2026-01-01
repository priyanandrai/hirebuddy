import express from "express";
import {
  sendOtp,
  verifyOtp,
  googleAuth,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
// Google auth (POST-login)
router.post("/google", googleAuth);

export default router;
