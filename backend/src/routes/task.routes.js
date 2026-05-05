import express from "express";
import {
  createTask,
  getMyTasks,
  acceptTask,
  getCategories,
  getTaskById,
  getAssignedTasks,
  getCreatedTasks,
  getNearbyTasks,
  searchTasks,
  updateTaskStatus,
  cancelTask,
  getTaskStats,
} from "../controllers/task.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

// Category list (no auth needed)
router.get("/categories", getCategories);

// Task search and discovery
router.get("/search", searchTasks);
router.get("/nearby", authMiddleware, allowRoles("HELPER"), getNearbyTasks);

// User's own tasks
router.get("/my", authMiddleware, getMyTasks);
router.get("/created", authMiddleware, getCreatedTasks);
router.get("/assigned", authMiddleware, allowRoles("HELPER"), getAssignedTasks);
router.get("/stats", authMiddleware, getTaskStats);

// Create task
router.post("/", authMiddleware, createTask);

// Task actions
router.post("/:id/accept", authMiddleware, allowRoles("HELPER"), acceptTask);
router.put("/:id/status", authMiddleware, updateTaskStatus);
router.put("/:id/cancel", authMiddleware, cancelTask);

// Get task details (must be last)
router.get("/:id", authMiddleware, getTaskById);

export default router;
