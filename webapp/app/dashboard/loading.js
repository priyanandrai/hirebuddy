import { ShimmerBlock, ServiceGridCardShimmer } from "@/app/components/ui/Shimmer";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#060d1d] px-4 pb-16 pt-6 sm:px-6">
      <div className="mx-auto max-w-[1360px]">
        {/* Hero Shimmer */}
        <div className="mb-6 flex flex-col justify-between gap-6 pt-1 lg:flex-row lg:items-center">
          <div className="space-y-2.5">
            <ShimmerBlock className="h-8 w-72 rounded-lg" />
            <ShimmerBlock className="h-8 w-52 rounded-lg" />
            <ShimmerBlock className="h-4 w-96 max-w-full rounded" />
          </div>
          <div className="flex items-center gap-10">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <ShimmerBlock className="h-10 w-10 rounded-full" />
                <ShimmerBlock className="h-3 w-14 rounded" />
                <ShimmerBlock className="h-3 w-12 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* 2-Column Layout Shimmer */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[255px_1fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#162542] bg-[#0a1326]/95 p-4 space-y-2.5">
              <ShimmerBlock className="h-5 w-28 rounded mb-3" />
              {Array.from({ length: 10 }).map((_, i) => (
                <ShimmerBlock key={i} className="h-8 w-full rounded-xl" />
              ))}
            </div>
            <div className="rounded-2xl border border-[#162542] bg-[#0a1326]/95 p-4 space-y-4">
              <ShimmerBlock className="h-5 w-24 rounded" />
              <ShimmerBlock className="h-9 w-full rounded-lg" />
              <ShimmerBlock className="h-12 w-full rounded-lg" />
              <ShimmerBlock className="h-14 w-full rounded-lg" />
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <ShimmerBlock className="h-6 w-44 rounded" />
              <ShimmerBlock className="h-8 w-36 rounded-lg" />
            </div>
            <ServiceGridCardShimmer count={6} />
          </div>
        </div>
      </div>
    </div>
  );
}
