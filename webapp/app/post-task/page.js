import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";


export default function PostTaskPage() {
  return (
    <>
      <Header />

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Post a Task
        </h1>
        <p className="text-gray-600 mb-8">
          Tell us what you need done and we’ll connect you with trusted helpers.
        </p>

        <form className="bg-white p-6 rounded-xl shadow-sm space-y-4">
          <input
            placeholder="Task title"
            className="w-full border rounded-lg px-4 py-2"
          />

          <textarea
            placeholder="Describe your task"
            className="w-full border rounded-lg px-4 py-2 h-28"
          />

          <input
            placeholder="Location / Pin Code"
            className="w-full border rounded-lg px-4 py-2"
          />

          <input
            placeholder="Budget (₹)"
            className="w-full border rounded-lg px-4 py-2"
          />

          <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium">
            Post Task
          </button>
        </form>
      </main>

      <Footer />
    </>
  );
}
