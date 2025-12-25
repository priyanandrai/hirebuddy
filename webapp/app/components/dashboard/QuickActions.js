export default function QuickActions() {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold mb-3">Quick Actions</h3>
        <div className="flex gap-3 flex-wrap">
          <button className="px-4 py-2 bg-black text-white rounded-lg">
            Create Task
          </button>
          <button className="px-4 py-2 bg-gray-100 rounded-lg">
            Assign Worker
          </button>
          <button className="px-4 py-2 bg-gray-100 rounded-lg">
            View Reports
          </button>
        </div>
      </div>
    );
  }
  