import { generateNoIndexMetadata } from "../lib/seo";

export const metadata = generateNoIndexMetadata("Sign Up", "Create your HireBuddy account.");

export default function SignupLayout({ children }) {
  return children;
}
