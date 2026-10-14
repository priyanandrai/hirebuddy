import express from "express";
import { uploadMiddleware, uploadDocument } from "../controllers/upload.controller.js";

const router = express.Router();

// Error handling wrapper for Multer
const handleMulterUpload = (req, res, next) => {
  const uploadSingle = uploadMiddleware.single("file");
  uploadSingle(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "File upload failed",
      });
    }
    next();
  });
};

router.post("/document", handleMulterUpload, uploadDocument);

export default router;
