"use client";
import { useSession } from "next-auth/react";
import HeroIllustration from "./components/illustrations/HeroIllustration";
import Footer from "./components/layout/Footer";
import Header from "./components/layout/Header";
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
            {[
              "Cleaning",
              "Repairs",
              "Furniture Assembly",
              "Grocery Shopping",
            ].map((item) => (
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

function CategoryCard({ title }) {
  return (
    <div className="group cursor-pointer rounded-xl border border-slate-800 bg-slate-900/90 p-6 transition hover:border-blue-500 hover:shadow-sm">
      <div className="text-sm font-medium text-white mb-1">
        {title}
      </div>

      <p className="text-xs text-slate-300">Find trusted helpers</p>
    </div>
  );
}


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
  return (
    <div className="flex flex-col items-center text-center">

      <div className="mb-4 h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
        {/* icon can go here later */}
      </div>

      <h3 className="text-sm font-semibold text-gray-900">
        {title}
      </h3>

      <p className="text-xs text-gray-500 mt-1 max-w-[140px]">
        {description}
      </p>

    </div>
  );
}


