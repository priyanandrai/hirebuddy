import { generatePageMetadata } from "../lib/seo";

export const metadata = generatePageMetadata({
  title: "Refund & Escrow Policy – HireBuddy Customer Payment Protection",
  description:
    "Understand how HireBuddy protects customer payments in settlement hold until job completion and processes full or partial refunds.",
  path: "/refund-policy",
});

export default function RefundPolicyLayout({ children }) {
  return children;
}
