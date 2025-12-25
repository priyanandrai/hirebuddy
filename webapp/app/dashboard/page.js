export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-6">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">
          Hi Rahul 👋
        </h1>
        <button className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700">
          Post a New Task
        </button>
      </header>

      {/* Search */}
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search services or tasks..."
          className="w-full rounded-md border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Quick Actions */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-gray-700">
          Quick Actions
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickCard title="Home & Repairs">
            Cleaning • Repairs • Furniture
          </QuickCard>

          <QuickCard title="Shopping">
            Buy from Market • Upload Prescription
          </QuickCard>

          <QuickCard title="Travel & Drivers">
            Driver • Pickup & Drop
          </QuickCard>

          <QuickCard title="Health & Care">
            Doctor Visit • Elder Care
          </QuickCard>
        </div>
      </section>

      {/* Upcoming Tasks */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-gray-700">
          Your Upcoming Tasks
        </h2>

        <div className="space-y-3">
          <TaskItem
            title="Cleaning Living Room"
            time="Today, 10:00 AM"
            price="₹400"
            helper="Rahim B."
          />

          <TaskItem
            title="Driver for Doctor Visit"
            time="Wed, Apr 24"
            price="₹1,200"
            helper="Assigned"
          />
        </div>
      </section>

      {/* Helpers */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-gray-700">
          Your Helpers
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <HelperCard
            name="Rahim B."
            rating="4.9"
            tasks="56"
            skills="Cleaning, Furniture Assembly"
          />

          <HelperCard
            name="Sonia B."
            rating="4.8"
            tasks="31"
            skills="Medicine Pickup, Driver Help"
          />
        </div>
      </section>

      {/* Support */}
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-gray-700">
          Need Help?
        </h2>
        <p className="mb-4 text-gray-600">
          Our support team is available 24/7.
        </p>

        <button className="rounded-md bg-gray-800 px-4 py-2 text-white hover:bg-black">
          Contact Support
        </button>
      </section>
    </main>
  );
}

/* ---------------- Components ---------------- */

function QuickCard({ title, children }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <h3 className="mb-1 font-semibold text-gray-800">{title}</h3>
      <p className="text-sm text-gray-600">{children}</p>
    </div>
  );
}

function TaskItem({ title, time, price, helper }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
      <div>
        <p className="font-medium text-gray-800">{title}</p>
        <p className="text-sm text-gray-500">{time}</p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-gray-800">{price}</p>
        <p className="text-sm text-green-600">{helper}</p>
      </div>
    </div>
  );
}

function HelperCard({ name, rating, tasks, skills }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <h3 className="font-semibold text-gray-800">{name}</h3>
      <p className="text-sm text-gray-600">
        ⭐ {rating} • {tasks} tasks
      </p>
      <p className="mt-1 text-sm text-gray-500">{skills}</p>

      <button className="mt-3 w-full rounded-md bg-green-600 px-3 py-2 text-white hover:bg-green-700">
        View Profile
      </button>
    </div>
  );
}
