import Footer from "../components/layout/Footer";
import HelperHeader from "./helperheader";
import RealtimeNotificationCenter from "../components/ui/RealtimeNotificationCenter";
import { generateNoIndexMetadata } from "../lib/seo";

export const metadata = generateNoIndexMetadata(
  "Helper Partner Dashboard",
  "Manage your HireBuddy helper tasks, earnings, tax profile, and payouts."
);

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      {/* Header */}
      <HelperHeader />
      <RealtimeNotificationCenter role="HELPER" />

      {/* Main Content */}
      <main className="flex-1 bg-slate-950">
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
