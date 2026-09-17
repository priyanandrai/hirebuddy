export const CATEGORIES = [
  "Cleaning",
  "Repairs",
  "Furniture Assembly",
  "Grocery Shopping",
  "Elder Care",
  "Delivery",
  "Driver",
  "Home Support",
];

export function slugify(title) {
  return title.toLowerCase().replace(/\s+/g, '-');
}
