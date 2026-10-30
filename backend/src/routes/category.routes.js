import express from "express";
import {
  getAllCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  getFilteredServices,
} from "../controllers/category.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/services", getFilteredServices);
router.get("/", getAllCategories);
router.post("/", authMiddleware, createCategory);
router.put("/:id", authMiddleware, updateCategory);
router.delete("/:id", authMiddleware, deleteCategory);
router.get("/:slug", getCategoryBySlug);

export default router;
