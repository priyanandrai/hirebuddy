import * as categoryService from "../services/category.service.js";

/**
 * Get all categories
 */
export const getAllCategories = async (req, res) => {
  try {
    const categories = await categoryService.getAllCategories();
    if (req.query.format === "names") {
      return res.json(categories.map((c) => c.name));
    }
    res.json(categories);
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
};

/**
 * Get category by slug
 */
export const getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await categoryService.getCategoryBySlug(slug);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
  } catch (error) {
    console.error("Get category by slug error:", error);
    res.status(500).json({ message: "Failed to fetch category" });
  }
};

/**
 * Create category (Admin action)
 */
export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }
    const category = await categoryService.createCategory(req.body);
    res.status(201).json({ success: true, category });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({ message: error.message || "Failed to create category" });
  }
};

/**
 * Update category (Admin action)
 */
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await categoryService.updateCategory(id, req.body);
    res.json({ success: true, category });
  } catch (error) {
    console.error("Update category error:", error);
    res.status(500).json({ message: error.message || "Failed to update category" });
  }
};

/**
 * Delete category (Admin action)
 */
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await categoryService.deleteCategory(id);
    res.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ message: error.message || "Failed to delete category" });
  }
};

/**
 * Get filtered services and category counts for User Home Page
 */
export const getFilteredServices = async (req, res) => {
  try {
    const result = await categoryService.getFilteredServices(req.query);
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Get filtered services error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch filtered services",
    });
  }
};

