import express from "express";
import {
  setRole,
  updateHelperProfile,
  getHelperById,
  getHelpersList,
  submitIdDocument,
  verifyUserId,
  getPendingIdSubmissions,
  getAssignedHelpersFromMyTasks,
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/set-role", authMiddleware, setRole);
router.post("/helper-profile", authMiddleware, updateHelperProfile);
router.post("/id/submit", authMiddleware, submitIdDocument);
router.get("/helper/:id", getHelperById); //
router.get("/helpers", authMiddleware, getHelpersList);
// 👇 helpers assigned to my tasks
router.get("/assigned-helpers", authMiddleware, getAssignedHelpersFromMyTasks);
router.get('/pending-ids', authMiddleware, getPendingIdSubmissions);
router.patch('/id/:id/verify', authMiddleware, verifyUserId);

export default router;
