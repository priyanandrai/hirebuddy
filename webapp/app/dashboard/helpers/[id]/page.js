"use client";

import { useParams, useRouter } from "next/navigation";

export default function HelperProfilePage() {
  const { id } = useParams();
  const router = useRouter();

  // Mock helper
  const helper = {
    id,
    name: "Rahul Kumar",
    rating: 4.8,
    jobs: 120,
    location: "Noida",
    skills: ["Shopping", "Delivery", "Home Help"],
    bio: "Experienced helper with 3+ years in daily errands and delivery.",
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      
      {/* Profile Card */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-xl font-bold text-green-700">
            {helper.name.charAt(0)}
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {helper.name}
            </h1>
            <p className="text-sm text-gray-600">
              {helper.location}
            </p>
            <p className="text-sm mt-1">
              ⭐ {helper.rating} · {helper.jobs} jobs completed
            </p>
          </div>
        </div>

        {/* Bio */}
        <div className="mt-6">
          <h3 className="font-semibold text-gray-900">
            About
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            {helper.bio}
          </p>
        </div>

        {/* Skills */}
        <div className="mt-6">
          <h3 className="font-semibold text-gray-900">
            Services
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {helper.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Hire */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={() =>
              router.push(`/dashboard/create-task?helper=${helper.id}`)
            }
            className="rounded-md bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Hire This Helper
          </button>
        </div>
      </div>
    </main>
  );
}
