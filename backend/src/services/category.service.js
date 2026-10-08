import prisma from "../utils/prisma.js";
import { CATEGORIES_DATA } from "../../scripts/seed-categories.js";

/**
 * Get all categories from database
 */
export const getAllCategories = async () => {
  let categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  // If DB has no categories yet, auto-seed them
  if (!categories || categories.length === 0) {
    for (const cat of CATEGORIES_DATA) {
      await prisma.category.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat,
      });
    }
    categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
  }

  return categories;
};

/**
 * Get category by slug from database
 */
export const getCategoryBySlug = async (slug) => {
  if (!slug) return null;
  return prisma.category.findUnique({
    where: { slug: slug.toLowerCase() },
  });
};
