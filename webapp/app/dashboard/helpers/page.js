"use client";

import { getHelpers } from "@/app/components/services/user.service";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HelpersPage() {
  const [query, setQuery] = useState("");
  const [helpers, setHelpers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 Fetch helpers on page load
  useEffect(() => {
    const fetchHelpers = async () => {
      try {
        const res = await getHelpers();
        console.log("fetch helper res",res);
        
        // assuming API returns array
        setHelpers(res.data || res);
      } catch (error) {
        console.error("Failed to fetch helpers", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHelpers();
  }, []);

  // const helpers = [
  //   {
  //     id: 1,
  //     name: "Rahul Kumar",
  //     skills: ["Shopping", "Delivery"],
  //     rating: 4.8,
  //     jobs: 120,
  //     location: "Noida",
  //   },
  //   {
  //     id: 2,
  //     name: "Amit Singh",
  //     skills: ["Doctor Visit", "Travel Assistance"],
  //     rating: 4.6,
  //     jobs: 78,
  //     location: "Delhi",
  //   },
  //   {
  //     id: 3,
  //     name: "Suresh Yadav",
  //     skills: ["Home Help", "Shopping"],
  //     rating: 4.9,
  //     jobs: 210,
  //     location: "Ghaziabad",
  //   },
  // ];

  const filtered = helpers.filter(
    (h) =>
      h?.name?.toLowerCase().includes(query.toLowerCase()) ||
      h?.skills?.join(" ").toLowerCase().includes(query.toLowerCase())
  );
  if (loading) {
    return <p className="text-center mt-10">Loading helpers...</p>;
  }
  return (
    <main className="mx-auto max-w-6xl px-6 py-8 text-slate-100">
      <div className="mb-6 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/30">
        <h1 className="text-2xl font-bold text-white">Find Helpers</h1>
        <p className="mt-1 text-sm text-slate-300">
          Browse helpers and view their profiles before hiring
        </p>
      </div>

      <div className="mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or service (e.g. delivery)"
          className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((helper) => (
          <div key={helper.id} className="rounded-[1.5rem] border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/20">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/15 font-semibold text-blue-300">
                {helper.name.charAt(0)}
              </div>

              <div>
                <p className="font-medium text-white">{helper.name}</p>
                <p className="text-xs text-slate-400">{helper.location}</p>
              </div>
            </div>

            <div className="mt-4 text-sm text-slate-300">Skills: {helper?.skills?.join(", ")}</div>
            <div className="mt-2 text-sm text-slate-300">⭐ {helper?.rating} · {helper?.jobs} jobs</div>

            <Link href={`/dashboard/helpers/${helper?.id}`} className="mt-4 block rounded-2xl bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-blue-500">
              View Profile
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
