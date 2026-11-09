import { generatePageMetadata } from "../lib/seo";

export const metadata = generatePageMetadata({
  title: "Become a Helper Partner on HireBuddy – Earn with Zero Joining Fee",
  description:
    "Join HireBuddy as a verified service partner in Noida, Ghaziabad, Delhi, or Meerut. Receive local home cleaning, plumbing, electrical, and driving tasks.",
  path: "/become-a-helper",
});

export default function BecomeAHelperLayout({ children }) {
  return children;
}
