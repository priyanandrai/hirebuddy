"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { googleBackendLogin, sendOtpApi, verifyOtpApi } from "../components/lib/api";

export default function OtpLoginPage() {
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [isResendEnabled, setIsResendEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [showGooglePopup, setShowGooglePopup] = useState(false);

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/post-task" });
  };

  const router = useRouter();
  const { data: session, status } = useSession({
    refetchOnWindowFocus: true,
  });

  /* Handle Google login after NextAuth callback or already authenticated user */
  useEffect(() => {
    if (status === "authenticated" && session) {
      router.replace("/post-task");
      return;
    }

    if (status === "authenticated" && !session) {
      setError("Session is authenticated but user data is unavailable.");
    }

    if (status !== "loading") {
      setPageLoading(false);
    }
  }, [status, session, router]);

  const redirectByRole = (role) => {
    if (role === "HELPER") {
      router.push("/dashboard-tasker");
    } else {
      router.push("/dashboard");
    }
  };

  /* Countdown timer */
  useEffect(() => {
    let interval;

    if (step === "otp" && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }

    if (timer === 0) {
      setIsResendEnabled(true);
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [step, timer]);

  useEffect(() => {
    const popupTimer = setTimeout(() => {
      setShowGooglePopup(true);
    }, 3000);

    return () => clearTimeout(popupTimer);
  }, []);

  /* Handle phone input */
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setPhone(value);
    }
  };

  /* Send OTP */
  const sendOtp = async () => {
    setError("");
    setLoading(true);
    try {
      await sendOtpApi(phone);
      setStep("otp");
      setTimer(30);
      setIsResendEnabled(false);
      setOtp(["", "", "", "", "", ""]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* Verify OTP & login */
  const handleVerifyOtp = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await verifyOtpApi(phone, otpCode);
      localStorage.setItem("token", data.token);
      redirectByRole(data.user.role);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* Handle OTP input */
  const handleOtpChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  /* Handle OTP backspace navigation */
  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6">
        <div className="rounded-2xl bg-slate-900/95 p-8 shadow-lg text-center border border-slate-800">
          <div className="mb-4 text-xl font-semibold text-white">Loading...</div>
          <div className="h-2 w-48 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full w-24 animate-pulse bg-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />

      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6 relative">
        {showGooglePopup && (
          <div className="fixed top-6 right-6 z-50 w-80 rounded-2xl border border-slate-800 bg-slate-900/95 p-4 shadow-xl backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Quick login</p>
                <h2 className="mt-2 text-base font-semibold text-white">Continue with Google</h2>
                <p className="mt-2 text-sm text-slate-300">Fast login with your Google account and continue instantly.</p>
              </div>
              <button
                onClick={() => setShowGooglePopup(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Close Google login prompt"
              >
                ✕
              </button>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <svg width="18" height="18" viewBox="0 0 48 48" className="h-4 w-4">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.7 1.22 9.2 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.2C12.43 13.72 17.77 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.5 24c0-1.57-.14-3.09-.4-4.57H24v9.13h12.7c-.55 2.96-2.18 5.47-4.63 7.15l7.2 5.6C43.98 36.92 46.5 30.94 46.5 24z" />
                <path fill="#FBBC05" d="M10.54 28.42c-.48-1.45-.76-2.99-.76-4.42s.27-2.97.76-4.42l-7.98-6.2C.92 16.04 0 19.91 0 24c0 4.09.92 7.96 2.56 11.62l7.98-6.2z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.79l-7.2-5.6c-2 1.35-4.57 2.15-8.7 2.15-6.23 0-11.57-4.22-13.46-9.92l-7.98 6.2C6.51 42.62 14.62 48 24 48z" />
              </svg>
              Continue with Google
            </button>
          </div>
        )}

        <div className="w-full max-w-md rounded-[2rem] border border-slate-800 bg-slate-900/95 shadow-sm p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-white">{step === "phone" ? "Log in with OTP" : "Enter OTP"}</h1>
            <p className="mt-2 text-sm text-slate-300">{step === "phone" ? "We’ll send a one-time password to your mobile number" : `OTP sent to +91 ${phone}`}</p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-4 rounded-xl bg-red-950/60 border border-red-700 px-4 py-2.5 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* PHONE STEP */}
          {step === "phone" && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Mobile Number
                </label>

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

              <button
                onClick={sendOtp}
                disabled={phone.length !== 10 || loading}
                className={`w-full rounded-2xl py-2.5 text-sm font-medium text-white transition ${phone.length === 10 && !loading ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-800 text-slate-400 cursor-not-allowed"}`}>
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </div>
          )}

          {/* OTP STEP */}
          {step === "otp" && (
            <div className="space-y-5">
              <div className="flex justify-center gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    className="h-12 w-10 rounded-lg border border-slate-700 bg-slate-800 text-center text-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ))}
              </div>

              <button onClick={handleVerifyOtp} disabled={loading} className={`w-full rounded-2xl py-2.5 text-sm font-medium text-white transition ${!loading ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-800 text-slate-400 cursor-not-allowed"}`}>{loading ? "Verifying..." : "Verify & Login"}</button>

              <div className="flex justify-between text-sm text-slate-300">
                <button
                  onClick={() => { setStep("phone"); setError(""); }}
                  className="hover:underline"
                >
                  Change number
                </button>

                {isResendEnabled ? (
                    <button onClick={sendOtp} className="text-blue-400 hover:underline">Resend OTP</button>
                ) : (
                  <span className="text-slate-500">
                    Resend in {timer}s
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="my-6 flex items-center gap-4 text-xs text-slate-500">
            <div className="flex-1 border-t" />
            OR
            <div className="flex-1 border-t" />
          </div>

          {/* Google login */}
          <button onClick={() => signIn("google", { callbackUrl: "/login" })} className="w-full rounded-2xl border border-slate-700 py-2.5 text-sm font-medium text-slate-100 hover:bg-slate-800 transition flex items-center justify-center gap-2">
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.7 1.22 9.2 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.2C12.43 13.72 17.77 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.5 24c0-1.57-.14-3.09-.4-4.57H24v9.13h12.7c-.55 2.96-2.18 5.47-4.63 7.15l7.2 5.6C43.98 36.92 46.5 30.94 46.5 24z" />
              <path fill="#FBBC05" d="M10.54 28.42c-.48-1.45-.76-2.99-.76-4.42s.27-2.97.76-4.42l-7.98-6.2C.92 16.04 0 19.91 0 24c0 4.09.92 7.96 2.56 11.62l7.98-6.2z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.79l-7.2-5.6c-2 1.35-4.57 2.15-8.7 2.15-6.23 0-11.57-4.22-13.46-9.92l-7.98 6.2C6.51 42.62 14.62 48 24 48z" />
            </svg>
            Continue with Google
          </button>

          {/* Signup */}
          <p className="mt-6 text-center text-sm text-slate-300">New to HireBuddy? <a href="/signup" className="text-blue-400 hover:text-white">Create an account</a></p>

          {/* Terms */}
          <p className="mt-3 text-center text-xs text-slate-500">By continuing, you agree to our <a href="/terms" className="text-blue-400 hover:text-white">Terms</a> & <a href="/privacy" className="text-blue-400 hover:text-white">Privacy Policy</a></p>
        </div>
      </div>

      <Footer />
    </>
  );
}
