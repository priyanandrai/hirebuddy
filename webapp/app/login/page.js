import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";

export default function LoginPage() {
  return (
    <>
      <Header />

      <main className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-sm">
          <h1 className="text-2xl font-bold mb-4">Log In</h1>

          <input
            placeholder="Email or Phone"
            className="w-full border rounded-lg px-4 py-2 mb-3"
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border rounded-lg px-4 py-2 mb-4"
          />

          <button className="w-full bg-green-700 text-white py-3 rounded-lg font-medium">
            Log In
          </button>

          <p className="text-sm text-center text-gray-600 mt-4">
            Don’t have an account?{" "}
            <span className="text-green-700 font-medium cursor-pointer">
              Sign up
            </span>
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}
