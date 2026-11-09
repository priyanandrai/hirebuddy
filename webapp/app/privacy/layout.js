import { generatePageMetadata } from "../lib/seo";

export const metadata = generatePageMetadata({
  title: "Privacy Policy – HireBuddy Data Protection & User Privacy",
  description:
    "Read HireBuddy's Privacy Policy explaining how we protect customer and helper personal data, KYC documents, and transaction records.",
  path: "/privacy",
});

export default function PrivacyLayout({ children }) {
  return children;
}
