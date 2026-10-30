"use client";

export function ShimmerBlock({ className = "" }) {
  return <div className={`shimmer-skeleton rounded-lg ${className}`} />;
}

/**
 * Shimmer skeleton for User Home Page service cards (/dashboard)
 */
export function HomeServiceCardShimmer({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col justify-between rounded-[18px] border border-[#132544] bg-[#071124] p-4 shadow-lg"
        >
          {/* Header: Icon + Title + Subtitle */}
          <div className="flex items-start gap-2.5">
            <div className="h-9 w-9 shrink-0 rounded-xl shimmer-skeleton" />
            <div className="flex-1 space-y-2 pt-0.5">
              <div className="h-4 w-3/4 rounded-md shimmer-skeleton" />
              <div className="h-3 w-full rounded-md shimmer-skeleton-subtle" />
            </div>
          </div>

          {/* Card Banner Image */}
          <div className="mt-3.5 h-[138px] w-full rounded-[13px] border border-[#152849] shimmer-skeleton" />

          {/* Bottom Row: Starting price + View button */}
          <div className="mt-3.5 flex items-center justify-between pt-0.5">
            <div className="h-4 w-28 rounded-md shimmer-skeleton" />
            <div className="h-7 w-16 rounded-lg shimmer-skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Shimmer skeleton for User Services Filter Page (/dashboard/services)
 */
export function ServiceGridCardShimmer({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-[22px] border border-[#15284a] bg-[#071124] shadow-xl flex flex-col justify-between"
        >
          <div>
            {/* Image Banner */}
            <div className="h-[175px] w-full shimmer-skeleton" />

            {/* Body */}
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="h-5 w-2/3 rounded-md shimmer-skeleton" />
                <div className="h-5 w-12 rounded-md shimmer-skeleton" />
              </div>
              <div className="h-3.5 w-full rounded-md shimmer-skeleton-subtle" />
              <div className="h-3.5 w-4/5 rounded-md shimmer-skeleton-subtle" />

              <div className="flex items-center justify-between pt-3 border-t border-[#122342]">
                <div className="space-y-1.5">
                  <div className="h-2.5 w-16 rounded shimmer-skeleton-subtle" />
                  <div className="h-5 w-20 rounded-md shimmer-skeleton" />
                </div>
                <div className="space-y-1.5 text-right">
                  <div className="h-2.5 w-20 rounded shimmer-skeleton-subtle ml-auto" />
                  <div className="h-3.5 w-24 rounded shimmer-skeleton" />
                </div>
              </div>
            </div>
          </div>

          <div className="px-5 pb-5 grid grid-cols-2 gap-2.5">
            <div className="h-9 rounded-xl shimmer-skeleton-subtle" />
            <div className="h-9 rounded-xl shimmer-skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Shimmer skeleton for Tasker Home Page & Available Tasks cards (/dashboard-tasker & /dashboard-tasker/tasks)
 */
export function HelperTaskCardShimmer({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col justify-between rounded-[18px] border border-[#152849] bg-[#081226]/95 p-5 shadow-xl"
        >
          <div>
            {/* Top row: Icon + Title + Urgent Badge */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="h-10 w-10 shrink-0 rounded-xl shimmer-skeleton" />
                <div className="flex-1 space-y-2 pt-0.5">
                  <div className="h-4 w-3/4 rounded-md shimmer-skeleton" />
                  <div className="h-3 w-1/2 rounded-md shimmer-skeleton-subtle" />
                </div>
              </div>
              <div className="h-5 w-14 rounded-md shimmer-skeleton" />
            </div>

            {/* Description lines */}
            <div className="mt-4 space-y-2">
              <div className="h-3 w-full rounded shimmer-skeleton-subtle" />
              <div className="h-3 w-4/5 rounded shimmer-skeleton-subtle" />
            </div>
          </div>

          <div className="mt-4">
            {/* Time + Price Row */}
            <div className="flex items-center justify-between border-t border-[#132544] pt-3">
              <div className="h-3.5 w-28 rounded shimmer-skeleton-subtle" />
              <div className="h-5 w-16 rounded-md shimmer-skeleton" />
            </div>

            {/* Buttons Row */}
            <div className="mt-3.5 grid grid-cols-2 gap-2.5">
              <div className="h-9 rounded-xl shimmer-skeleton" />
              <div className="h-9 rounded-xl shimmer-skeleton-subtle" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Shimmer skeleton for Search Results Helper Cards (/dashboard/search)
 */
export function HelperSearchCardShimmer({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col justify-between rounded-2xl border border-[#1b2b4b] bg-[#0b1426] overflow-hidden shadow-lg"
        >
          {/* Top Photo Banner */}
          <div className="w-full aspect-[334/116] shimmer-skeleton" />

          {/* Card Body */}
          <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="h-4 w-36 rounded-md shimmer-skeleton" />
                <div className="h-4 w-4 rounded-full shimmer-skeleton" />
              </div>

              <div className="flex items-center gap-3">
                <div className="h-3.5 w-24 rounded shimmer-skeleton-subtle" />
                <div className="h-3.5 w-28 rounded shimmer-skeleton-subtle" />
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="h-3 w-full rounded shimmer-skeleton-subtle" />
                <div className="h-3 w-4/5 rounded shimmer-skeleton-subtle" />
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                <div className="h-5 w-16 rounded-full shimmer-skeleton-subtle" />
                <div className="h-5 w-20 rounded-full shimmer-skeleton-subtle" />
                <div className="h-5 w-14 rounded-full shimmer-skeleton-subtle" />
              </div>
            </div>

            <div className="pt-3 border-t border-[#15233e] space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-3.5 w-32 rounded shimmer-skeleton-subtle" />
                <div className="h-5 w-20 rounded-md shimmer-skeleton" />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="h-8 rounded-xl shimmer-skeleton-subtle" />
                <div className="h-8 rounded-xl shimmer-skeleton" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Shimmer skeleton for Find & Invite Helpers Page (/dashboard/helpers & /categories/[slug])
 */
export function HelperDirectoryCardShimmer({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col justify-between rounded-3xl border border-slate-800/90 bg-[#0b1120]/95 p-5 sm:p-6 shadow-xl"
        >
          <div>
            {/* Top Row: Avatar + Name + Category */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5 flex-1">
                <div className="h-14 w-14 shrink-0 rounded-2xl shimmer-skeleton" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-32 rounded-md shimmer-skeleton" />
                  <div className="h-3 w-24 rounded-md shimmer-skeleton-subtle" />
                </div>
              </div>
              <div className="h-6 w-16 rounded-full shimmer-skeleton" />
            </div>

            {/* Rating / Jobs / Rate bar */}
            <div className="mt-4 h-10 w-full rounded-2xl shimmer-skeleton-subtle" />

            {/* Bio */}
            <div className="mt-3.5 space-y-2">
              <div className="h-3 w-full rounded shimmer-skeleton-subtle" />
              <div className="h-3 w-4/5 rounded shimmer-skeleton-subtle" />
            </div>

            {/* Skill pills */}
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              <div className="h-6 w-20 rounded-full shimmer-skeleton-subtle" />
              <div className="h-6 w-24 rounded-full shimmer-skeleton-subtle" />
              <div className="h-6 w-16 rounded-full shimmer-skeleton-subtle" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2.5">
            <div className="h-9 rounded-xl shimmer-skeleton-subtle" />
            <div className="h-9 rounded-xl shimmer-skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Shimmer skeleton for User My Tasks Page (/dashboard/my-tasks)
 */
export function MyTaskCardShimmer({ count = 2 }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-3xl border border-slate-800/90 bg-[#0b1120]/95 p-6 sm:p-7 shadow-2xl"
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Task Info Column */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2.5 flex-1">
                  <div className="flex items-center gap-2.5">
                    <div className="h-6 w-48 rounded-lg shimmer-skeleton" />
                    <div className="h-5 w-20 rounded-full shimmer-skeleton" />
                  </div>
                  <div className="h-3.5 w-64 rounded shimmer-skeleton-subtle" />
                </div>
                <div className="h-8 w-24 rounded-xl shimmer-skeleton" />
              </div>

              {/* Meta boxes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((box) => (
                  <div
                    key={box}
                    className="h-16 rounded-2xl border border-slate-800/80 shimmer-skeleton-subtle"
                  />
                ))}
              </div>

              {/* Description */}
              <div className="space-y-2 pt-1">
                <div className="h-3.5 w-full rounded shimmer-skeleton-subtle" />
                <div className="h-3.5 w-3/4 rounded shimmer-skeleton-subtle" />
              </div>

              {/* Bottom buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <div className="h-10 w-32 rounded-xl shimmer-skeleton" />
                <div className="h-10 w-32 rounded-xl shimmer-skeleton-subtle" />
                <div className="h-10 w-28 rounded-xl shimmer-skeleton-subtle" />
              </div>
            </div>

            {/* Right Assigned Helper Column */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-800/90 bg-[#0e1629] p-5 space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="h-14 w-14 rounded-2xl shimmer-skeleton shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-36 rounded-md shimmer-skeleton" />
                  <div className="h-3 w-28 rounded shimmer-skeleton-subtle" />
                </div>
              </div>
              <div className="h-16 w-full rounded-xl shimmer-skeleton-subtle" />
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="h-9 rounded-xl shimmer-skeleton" />
                <div className="h-9 rounded-xl shimmer-skeleton-subtle" />
                <div className="h-9 rounded-xl shimmer-skeleton-subtle" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Shimmer skeleton for Tasker My Tasks List (/dashboard-tasker/my-tasks)
 */
export function TaskerMyTaskRowShimmer({ count = 4 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2.5">
                <div className="h-5 w-48 rounded-md shimmer-skeleton" />
                <div className="h-5 w-24 rounded-full shimmer-skeleton" />
              </div>
              <div className="h-3.5 w-64 rounded shimmer-skeleton-subtle" />
            </div>
            <div className="h-7 w-20 rounded-lg shimmer-skeleton" />
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
            <div className="h-4 w-40 rounded shimmer-skeleton-subtle" />
            <div className="h-9 w-28 rounded-xl shimmer-skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Shimmer skeleton for Task Detail Page (/dashboard/my-tasks/[id] & /dashboard-tasker/my-tasks/[id])
 */
export function TaskDetailShimmer() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2.5 flex-1">
          <div className="h-7 w-56 rounded-lg shimmer-skeleton" />
          <div className="h-3.5 w-40 rounded shimmer-skeleton-subtle" />
        </div>
        <div className="h-7 w-28 rounded-full shimmer-skeleton" />
      </div>

      <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 space-y-5">
        <div className="space-y-2">
          <div className="h-3.5 w-24 rounded shimmer-skeleton-subtle" />
          <div className="h-4 w-full rounded shimmer-skeleton" />
          <div className="h-4 w-4/5 rounded shimmer-skeleton" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl shimmer-skeleton-subtle" />
          ))}
        </div>

        <div className="h-24 rounded-2xl shimmer-skeleton-subtle" />
      </div>
    </div>
  );
}

/**
 * Shimmer skeleton for Public Helper Profile Page (/helpers/[id])
 */
export function HelperProfilePageShimmer() {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <div className="w-full sm:w-60 h-72 rounded-2xl shimmer-skeleton shrink-0" />
          <div className="flex-1 space-y-4">
            <div className="h-7 w-56 rounded-lg shimmer-skeleton" />
            <div className="h-4 w-44 rounded shimmer-skeleton-subtle" />
            <div className="flex flex-wrap gap-2 pt-1">
              <div className="h-7 w-32 rounded-full shimmer-skeleton-subtle" />
              <div className="h-7 w-36 rounded-full shimmer-skeleton-subtle" />
              <div className="h-7 w-32 rounded-full shimmer-skeleton-subtle" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded-2xl shimmer-skeleton-subtle" />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-48 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shimmer-skeleton-subtle" />
          <div className="h-56 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shimmer-skeleton-subtle" />
        </div>
        <div className="h-72 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shimmer-skeleton-subtle" />
      </div>
    </div>
  );
}

/**
 * Shimmer skeleton for Notification rows (/dashboard/notifications & /dashboard-tasker/notifications)
 */
export function NotificationRowShimmer({ count = 4 }) {
  return (
    <div className="divide-y divide-slate-800/80">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-4 p-5">
          <div className="h-10 w-10 shrink-0 rounded-full shimmer-skeleton" />
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="h-4 w-44 rounded-md shimmer-skeleton" />
              <div className="h-3 w-16 rounded shimmer-skeleton-subtle" />
            </div>
            <div className="h-3.5 w-4/5 rounded shimmer-skeleton-subtle" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Shimmer skeleton for Earnings / Payment rows (/dashboard-tasker/earnings)
 */
export function PaymentRowShimmer({ count = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
        >
          <div className="space-y-2">
            <div className="h-4 w-44 rounded-md shimmer-skeleton" />
            <div className="h-3 w-28 rounded shimmer-skeleton-subtle" />
          </div>
          <div className="h-5 w-16 rounded-md shimmer-skeleton" />
        </div>
      ))}
    </div>
  );
}
