"use client";

import { useEffect, useState } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

export default function OtpLoginPage() {
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [isResendEnabled, setIsResendEnabled] = useState(false);

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

  /* Handle phone input */
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setPhone(value);
    }
  };

  /* Send OTP */
  const sendOtp = () => {
    setStep("otp");
    setTimer(30);
    setIsResendEnabled(false);
    // 🔐 Call OTP API here
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

  return (
    <>
      <Header />

      <div className="min-h-screen bg-[#f6f8fa] flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">
              {step === "phone" ? "Log in with OTP" : "Enter OTP"}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {step === "phone"
                ? "We’ll send a one-time password to your mobile number"
                : `OTP sent to +91 ${phone}`}
            </p>
          </div>

          {/* PHONE STEP */}
          {step === "phone" && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number
                </label>

                <div className="flex">
                  <span className="flex items-center rounded-l-lg border border-r-0 border-gray-300 px-3 text-sm text-gray-600">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={handlePhoneChange}
                    className="w-full rounded-r-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                onClick={sendOtp}
                disabled={phone.length !== 10}
                className={`w-full rounded-lg py-2.5 text-sm font-medium text-white transition
                  ${phone.length === 10
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-300 cursor-not-allowed"
                  }`}
              >
                Send OTP
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
                    onChange={(e) =>
                      handleOtpChange(e.target.value, index)
                    }
                    className="h-12 w-10 rounded-lg border border-gray-300 text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ))}
              </div>

              <button className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition">
                Verify & Login
              </button>

              <div className="flex justify-between text-sm text-gray-600">
                <button
                  onClick={() => setStep("phone")}
                  className="hover:underline"
                >
                  Change number
                </button>

                {isResendEnabled ? (
                  <button
                    onClick={sendOtp}
                    className="text-blue-600 hover:underline"
                  >
                    Resend OTP
                  </button>
                ) : (
                  <span className="text-gray-400">
                    Resend in {timer}s
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Signup */}
          <p className="mt-6 text-center text-sm text-gray-600">
            New to HireBuddy?{" "}
            <a href="/signup" className="text-blue-600 hover:underline">
              Create an account
            </a>
          </p>

          {/* Terms */}
          <p className="mt-3 text-center text-xs text-gray-500">
            By continuing, you agree to our{" "}
            <a href="/terms" className="text-blue-600 hover:underline">
              Terms
            </a>{" "}
            &{" "}
            <a href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>

      <Footer />
    </>
  );
}
