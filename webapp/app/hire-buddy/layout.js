import { generateNoIndexMetadata } from "../lib/seo";

export const metadata = generateNoIndexMetadata("Hire a Buddy", "Schedule your booking on HireBuddy.");

export default function HireBuddyLayout({ children }) {
  return children;
}
