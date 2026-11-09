import { generatePageMetadata } from "../lib/seo";

export const metadata = generatePageMetadata({
  title: "Terms & Conditions – HireBuddy Marketplace Platform Rules",
  description:
    "Review the Terms & Conditions governing service bookings, helper responsibilities, cancellations, and marketplace usage on HireBuddy.",
  path: "/terms",
});

export default function TermsLayout({ children }) {
  return children;
}
