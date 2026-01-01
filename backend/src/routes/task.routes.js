import express from "express";
import {
  createTask,
  getMyTasks,
  acceptTask,
  getCategories,
} from "../controllers/task.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
const router = express.Router();

router.post("/", authMiddleware, createTask); // Create task
router.get("/my", authMiddleware, getMyTasks); // My tasks
router.post("/:id/accept", authMiddleware, allowRoles("HELPER"), acceptTask);// Helper accepts
router.get("/categories", getCategories);

export default router;
