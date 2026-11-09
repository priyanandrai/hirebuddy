import { generateNoIndexMetadata } from "../lib/seo";

export const metadata = generateNoIndexMetadata("Seller Dashboard", "Manage your HireBuddy seller store.");

export default function SellerDashboardLayout({ children }) {
  return children;
}
