import QuickActions from "../components/dashboard/QuickActions";
import StatsCard from "../components/dashboard/StatsCard";
import TaskList from "../components/dashboard/TaskList";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Blinkit-style stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Active Tasks" value="42" />
        <StatsCard title="Completed Today" value="18" />
        <StatsCard title="Revenue" value="₹12,400" />
        <StatsCard title="Workers Online" value="9" />
      </div>

      {/* Quick actions */}
      <QuickActions />

      {/* TaskRabbit-style task list */}
      <TaskList />
    </div>
  );
}
