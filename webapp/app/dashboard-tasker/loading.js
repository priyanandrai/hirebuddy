import { HelperTaskCardShimmer } from "@/app/components/ui/Shimmer";

export default function TaskerDashboardLoading() {
  return (
    <div className="min-h-screen bg-[#030814] px-4 sm:px-8 py-6">
      <div className="mx-auto max-w-[1440px]">
        <HelperTaskCardShimmer count={6} />
      </div>
    </div>
  );
}
