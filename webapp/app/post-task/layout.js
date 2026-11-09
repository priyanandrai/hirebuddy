import { generateNoIndexMetadata } from "../lib/seo";

export const metadata = generateNoIndexMetadata("Post a Task", "Book a verified helper on HireBuddy.");

export default function PostTaskLayout({ children }) {
  return children;
}
