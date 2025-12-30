"use client";

import { useState } from "react";

export default function SupportPage() {
  const [form, setForm] = useState({
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    // 🔗 API call will go here later
    console.log("Support request:", form);

    setTimeout(() => {
      setLoading(false);
      alert("Your request has been submitted. Our team will contact you soon.");
      setForm({ subject: "", message: "" });
    }, 1000);
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Support
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Need help? We’re here for you.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        
        {/* Left: Help Info */}
        <div className="space-y-6">
          
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              Common Help Topics
            </h3>

            <ul className="mt-4 space-y-3 text-sm text-gray-700">
              <li>• How to create or cancel a task</li>
              <li>• Payment & refund issues</li>
              <li>• Helper delays or issues</li>
              <li>• Account & profile support</li>
              <li>• Safety & trust concerns</li>
            </ul>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              Contact Options
            </h3>

            <div className="mt-4 space-y-2 text-sm text-gray-700">
              <p>📧 Email: support@hirebuddy.in</p>
              <p>📞 Phone: +91 9XXXX XXXXX</p>
              <p>⏰ Support Hours: 9 AM – 6 PM</p>
            </div>
          </div>
        </div>

        {/* Right: Support Form */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Raise a Support Request
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Subject
              </label>
              <input
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="e.g. Issue with task payment"
                required
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Message
              </label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Describe your issue in detail..."
                rows={5}
                required
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
