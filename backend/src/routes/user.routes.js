import express from "express";
import {
  setRole,
  updateHelperProfile,
  getHelperById,
  getHelpersList,
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/set-role", setRole);
router.post("/helper-profile", updateHelperProfile);
router.get("/helper/:id", getHelperById); //
router.get("/helpers", authMiddleware, getHelpersList);
// 👇 helpers assigned to my tasks
// router.get("/assigned-helpers", authMiddleware, getAssignedHelpers);

export default router;
