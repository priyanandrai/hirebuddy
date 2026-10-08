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
