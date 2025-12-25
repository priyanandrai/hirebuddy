import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";

export default function BecomeHelperPage() {
  return (
    <>
      <Header />

      <main className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-4">
          Become a Helper
        </h1>
        <p className="text-gray-600 mb-10">
          Earn money by helping people in your city with daily tasks.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            "Flexible Work",
            "Quick Payments",
            "Trusted Platform",
          ].map((benefit) => (
            <div
              key={benefit}
              className="bg-white p-6 rounded-xl shadow-sm text-center"
            >
              <h3 className="font-semibold">{benefit}</h3>
            </div>
          ))}
        </div>

        <form className="bg-white p-6 rounded-xl shadow-sm space-y-4">
          <input
            placeholder="Full Name"
            className="w-full border rounded-lg px-4 py-2"
          />

          <input
            placeholder="Phone Number"
            className="w-full border rounded-lg px-4 py-2"
          />

          <select className="w-full border rounded-lg px-4 py-2">
            <option>Select Service Category</option>
            <option>Shopping</option>
            <option>Driving</option>
            <option>Health Assistance</option>
          </select>

          <button className="w-full bg-green-700 text-white py-3 rounded-lg font-medium">
            Apply as Helper
          </button>
        </form>
      </main>

      <Footer />
    </>
  );
}
