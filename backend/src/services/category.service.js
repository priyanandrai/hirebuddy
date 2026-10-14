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

/**
 * Create a new category
 */
export const createCategory = async (data) => {
  const { name, slug, description, icon, subServices, isPopular = true } = data;
  const generatedSlug = slug
    ? slug.toLowerCase().trim().replace(/\s+/g, '-')
    : name.toLowerCase().trim().replace(/\s+/g, '-');

  return prisma.category.create({
    data: {
      name: name.trim(),
      slug: generatedSlug,
      description: description || null,
      icon: icon || null,
      subServices: Array.isArray(subServices) ? subServices : [],
      isPopular: Boolean(isPopular),
    },
  });
};

/**
 * Update an existing category
 */
export const updateCategory = async (id, data) => {
  const { name, slug, description, icon, subServices, isPopular } = data;
  const updateData = {};
  if (name !== undefined) updateData.name = name.trim();
  if (slug !== undefined) updateData.slug = slug.toLowerCase().trim().replace(/\s+/g, '-');
  if (description !== undefined) updateData.description = description;
  if (icon !== undefined) updateData.icon = icon;
  if (subServices !== undefined) updateData.subServices = Array.isArray(subServices) ? subServices : [];
  if (isPopular !== undefined) updateData.isPopular = Boolean(isPopular);

  return prisma.category.update({
    where: { id },
    data: updateData,
  });
};

/**
 * Delete a category
 */
export const deleteCategory = async (id) => {
  return prisma.category.delete({
    where: { id },
  });
};

