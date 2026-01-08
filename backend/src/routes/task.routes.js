import express from "express";
import {
  createTask,
  getMyTasks,
  acceptTask,
  getCategories,
  getTaskById,
  getAssignedTasks
} from "../controllers/task.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
const router = express.Router();

router.post("/", authMiddleware, createTask); // Create task
router.get("/my", authMiddleware, getMyTasks); // My tasks
router.get("/:id", authMiddleware, getTaskById); // My tasks
router.post("/:id/accept", authMiddleware, allowRoles("HELPER"), acceptTask);// Helper accepts
router.get("/categories", getCategories);
// 👇 helper-only: tasks assigned to me
router.get("/assigned", authMiddleware, getAssignedTasks);
// 👇 list tasks created by logged-in user
router.get("/created", authMiddleware, getCreatedTasks);

export default router;
