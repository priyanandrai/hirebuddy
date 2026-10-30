import express from "express";
import {
  createTask,
  getMyTasks,
  acceptTask,
  declineTask,
  getCategories,
  addCategory,
  getTaskById,
  getAssignedTasks,
  getCreatedTasks,
  getNearbyTasks,
  searchTasks,
  updateTaskStatus,
  cancelTask,
  deleteTask,
  getTaskStats,
} from "../controllers/task.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

// Category list and creation
router.get("/categories", getCategories);
router.post("/categories", addCategory);

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
router.post("/:id/decline", authMiddleware, allowRoles("HELPER"), declineTask);
router.put("/:id/status", authMiddleware, updateTaskStatus);
router.put("/:id/cancel", authMiddleware, cancelTask);
router.delete("/:id", authMiddleware, deleteTask);

// Get task details (must be last)
router.get("/:id", authMiddleware, getTaskById);

export default router;
