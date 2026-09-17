"use client";
import { useSession } from "next-auth/react";
import HeroIllustration from "./components/illustrations/HeroIllustration";
import Footer from "./components/layout/Footer";
import Header from "./components/layout/Header";
import CategoryCard from "./components/category/CategoryCard";
import { CATEGORIES } from './components/category/categories';
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { googleBackendLogin } from "./components/lib/api";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === "authenticated" && session) {
      (async () => {
        try {
          const data = await googleBackendLogin(session);

          // Save backend JWT
          localStorage.setItem("token", data.token);
          router.push("/dashboard");

          // Redirect based on role
          if (data.user.role === "HELPER") {
            router.push("/dashboard-tasker");
          } else {
            router.push("/dashboard");
          }
        } catch (err) {
          console.error(err);
        }
      })();
    }
  }, [status, session]);
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <Header />

      <section className="bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              Help for daily life —<br />
              shopping, travel, health & home
            </h1>

            <p className="text-slate-300 mt-5 max-w-xl">
              Book trusted local helpers for errands, doctor visits, driving,
              shopping, and everyday needs — all in one place.
            </p>

            <div className="flex flex-wrap gap-4 mt-8">
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
                Post a Task
              </button>

              <button className="px-6 py-3 border border-slate-700 text-slate-100 bg-slate-900/80 rounded-lg font-medium hover:bg-slate-800 transition">
                Become a Helper
              </button>
            </div>

            <div className="mt-6">
              <select className="w-64 px-4 py-3 rounded-lg border border-slate-700 text-slate-100 bg-slate-900/80 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Modipuram, Meerut</option>
              </select>
            </div>
          </div>

          <div className="hidden md:flex justify-center">
            <div className="w-full max-w-md h-72 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden flex items-center justify-center">
              <img
                src="/home2.png"
                alt="HireBuddy product preview"
                className="w-full h-full object-contain p-4"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Browse Categories
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {CATEGORIES.slice(0, 8).map((item) => (
              <CategoryCard key={item} title={item} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-semibold text-white mb-8">
            Popular Services
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ServiceBlock
              title="Shopping & Purchases"
              items={["Buy from Market", "Upload Prescription"]}
            />
            <ServiceBlock
              title="Travel & Driver Help"
              items={["Hire a Driver", "Travel Helper"]}
            />
            <ServiceBlock
              title="Health & Care Assistance"
              items={["Pickup & Drop", "Medical Errands"]}
            />
            <ServiceBlock
              title="Home Support"
              items={["Elder Care", "Daily Assistance"]}
            />
          </div>
        </div>
      </section>

      <section className="bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="text-center text-2xl font-semibold text-white mb-10">
            Safe & Reliable
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <TrustItem title="ID Checked" description="Verified helpers only" />
            <TrustItem title="Secure Payments" description="Protected transactions" />
            <TrustItem title="Live Tracking" description="Real-time task updates" />
            <TrustItem title="24/7 Support" description="Always here to help" />
          </div>
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Built for everyday reliability
            </h2>

            <p className="text-slate-300 max-w-md">
              Whether it’s shopping, travel, or care for loved ones, HireBuddy
              connects you with trusted local helpers — quickly and safely.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                Verified local helpers
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                Transparent pricing
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                Real-time task tracking
              </li>
            </ul>
          </div>

          <div className="flex justify-center">
            <HeroIllustration />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

/* ---------- Reusable Components ---------- */

// CategoryCard moved to components/category/CategoryCard.js


function ServiceBlock({ title, items }) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 hover:shadow-sm transition">
      <h3 className="text-lg font-semibold text-white mb-3">
        {title}
      </h3>

      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className="text-sm text-slate-300 flex items-center gap-2"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}


function TrustItem({ title, description }) {
  const renderIcon = (key) => {
    const commonProps = { width: 28, height: 28, fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' };

    switch (key) {
      case 'ID Checked':
        return (
          <svg {...commonProps} viewBox="0 0 24 24" aria-hidden>
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" />
            <path d="M6 20v-1c0-2.21 3.58-4 6-4s6 1.79 6 4v1" />
            <path d="M9.5 12.5l1.5 1.5 3-3" />
          </svg>
        );
      case 'Secure Payments':
        return (
          <svg {...commonProps} viewBox="0 0 24 24" aria-hidden>
            <rect x="2" y="7" width="20" height="12" rx="2" />
            <path d="M16 3v4" />
            <path d="M7 12h.01" />
          </svg>
        );
      case 'Live Tracking':
        return (
          <svg {...commonProps} viewBox="0 0 24 24" aria-hidden>
            <path d="M12 2C8 2 4 6 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4-4-8-8-8z" />
            <circle cx="12" cy="10" r="2" />
          </svg>
        );
      case '24/7 Support':
        return (
          <svg {...commonProps} viewBox="0 0 24 24" aria-hidden>
            <path d="M12 2a7 7 0 0 0-7 7v3a5 5 0 0 0 5 5h4" />
            <path d="M18 18v1a2 2 0 0 1-2 2h-6" />
            <path d="M20 8v6" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center text-center">

      <div className="mb-4 h-14 w-14 rounded-full bg-slate-800 flex items-center justify-center text-blue-400" aria-hidden>
        {renderIcon(title)}
      </div>

      <h3 className="text-sm font-semibold text-white">
        {title}
      </h3>

      <p className="text-xs text-slate-300 mt-1 max-w-[160px]">
        {description}
      </p>

    </div>
  );
}


