import { generateNoIndexMetadata } from "../lib/seo";

export const metadata = generateNoIndexMetadata("Login", "Sign in to your HireBuddy account.");

export default function LoginLayout({ children }) {
  return children;
}
