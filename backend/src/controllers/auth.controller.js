import {
    sendOtpService,
    verifyOtpService,
    googleAuthService
  } from "../services/auth.service.js";
  
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