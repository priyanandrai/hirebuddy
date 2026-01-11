import express from "express";
import { getAssignedUsers } from "../controllers/helper.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// 👇 list users whose tasks are assigned to this helper
router.get("/assigned-users", authMiddleware, getAssignedUsers);

export default router;
