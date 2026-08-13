"use client";

import { useEffect, useState } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { useSession, signIn, signOut } from "next-auth/react";
import AuthenticatedHeader from "../components/layout/HeaderAfterlogin";
import { useRouter } from "next/navigation";
import { googleBackendLogin, manualSignup } from "../components/lib/api";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setPhone(value);
    }
  };
  const redirectByRole = (role) => {
    if (role === "HELPER") {
      router.push("/dashboard-tasker");
    } else {
      router.push("/dashboard");
    }
  };

  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session) {
      (async () => {
        try {
          const data = await googleBackendLogin(session);
          localStorage.setItem("token", data.token);
          redirectByRole(data.user.role);
        } catch (err) {
          setError("Google signup failed. Please try again.");
        }
      })();
    }
  }, [status, session]);

  const handleManualSignup = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || phone.length !== 10 || !password.trim()) {
      setError("Please fill in all fields correctly.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const data = await manualSignup({ name, email, phone, password });
      localStorage.setItem("token", data.token);
      redirectByRole(data.user.role);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <>
      {status === "authenticated" ? <AuthenticatedHeader /> : <Header />}

      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md rounded-[2rem] border border-slate-800 bg-slate-900/95 shadow-2xl shadow-slate-950/40 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-white">Create your account</h1>
            <p className="mt-2 text-sm text-slate-400">Join HireBuddy and get help for everyday tasks</p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-red-950/60 border border-red-700 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleManualSignup}>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Mobile Number</label>
              <div className="flex rounded-2xl border border-slate-700 bg-slate-950">
                <span className="flex items-center rounded-l-2xl px-3 text-sm text-slate-300">+91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={handlePhoneChange}
                  className="w-full rounded-r-2xl bg-slate-950 px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={!name.trim() || !email.trim() || phone.length !== 10 || !password.trim() || loading}
              className={`w-full rounded-2xl py-2.5 text-sm font-medium text-white transition ${
                !loading && name.trim() && email.trim() && phone.length === 10 && password.trim()
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-slate-800 text-slate-400 cursor-not-allowed"
              }`}
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4 text-xs text-slate-500">
            <div className="flex-1 border-t border-slate-700" />
            OR
            <div className="flex-1 border-t border-slate-700" />
          </div>

          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-100 hover:bg-slate-800 transition flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.7 1.22 9.2 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.2C12.43 13.72 17.77 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.5 24c0-1.57-.14-3.09-.4-4.57H24v9.13h12.7c-.55 2.96-2.18 5.47-4.63 7.15l7.2 5.6C43.98 36.92 46.5 30.94 46.5 24z" />
              <path fill="#FBBC05" d="M10.54 28.42c-.48-1.45-.76-2.99-.76-4.42s.27-2.97.76-4.42l-7.98-6.2C.92 16.04 0 19.91 0 24c0 4.09.92 7.96 2.56 11.62l7.98-6.2z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.79l-7.2-5.6c-2 1.35-4.57 2.15-8.7 2.15-6.23 0-11.57-4.22-13.46-9.92l-7.98 6.2C6.51 42.62 14.62 48 24 48z" />
            </svg>
            Continue with Google
          </button>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account? <a href="/login" className="text-blue-400 hover:text-blue-300">Log in</a>
          </p>
        </div>
      </div>

      <Footer />
    </>
  );
}
