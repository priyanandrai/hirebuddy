"use client";

import Link from "next/link";
import {
  HelpCircle,
  Phone,
  MessageCircle,
  AlertCircle,
  CreditCard,
  User,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Headphones,
  FileQuestion,
  Clock,
} from "lucide-react";

export default function TaskerSupportPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 sm:px-6 py-6 pb-24 text-slate-100 max-w-4xl mx-auto">
      {/* Header */}
      <section className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard-tasker"
            className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Headphones className="w-6 h-6 text-blue-400" />
              Help & Support
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              We are here to assist you 24/7 with any helper inquiries
            </p>
          </div>
        </div>
      </section>

      {/* Direct Contact Cards */}
      <section className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a
          href="tel:+919000000000"
          className="group flex items-center justify-between p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 hover:border-emerald-500/40 transition-all shadow-lg hover:shadow-emerald-500/10"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <p className="text-base font-semibold text-white group-hover:text-emerald-300 transition-colors">
                Call Support
              </p>
              <p className="text-xs text-slate-400">
                Direct phone helpline (9 AM - 8 PM)
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
        </a>

        <a
          href="https://wa.me/919000000000"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-between p-4 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 hover:border-green-500/40 transition-all shadow-lg hover:shadow-green-500/10"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-base font-semibold text-white group-hover:text-green-300 transition-colors">
                WhatsApp Support
              </p>
              <p className="text-xs text-slate-400">
                Chat with our support executive
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-green-400 group-hover:translate-x-0.5 transition-all" />
        </a>
      </section>

      {/* Quick Help Categories */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3 px-1">
          Common Topics
        </h2>
        <div className="space-y-3">
          <SupportCard
            icon={<AlertCircle className="w-5 h-5 text-amber-400" />}
            iconBg="bg-amber-500/10"
            title="Problem with an Active Task"
            desc="Issues with customer location, scope, or task requirements"
            href="/dashboard-tasker/my-tasks"
          />

          <SupportCard
            icon={<CreditCard className="w-5 h-5 text-blue-400" />}
            iconBg="bg-blue-500/10"
            title="Payment & Payout Status"
            desc="Check completed task earnings, wallet balance, and bank transfers"
            href="/dashboard-tasker/earnings"
          />

          <SupportCard
            icon={<User className="w-5 h-5 text-purple-400" />}
            iconBg="bg-purple-500/10"
            title="Profile & KYC Verification"
            desc="Update your services, hourly rates, or check document verification status"
            href="/dashboard-tasker/profile"
          />

          <SupportCard
            icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />}
            iconBg="bg-emerald-500/10"
            title="Trust & Safety Guidelines"
            desc="Learn about community safety standards, ratings, and code of conduct"
            href="/about"
          />
        </div>
      </section>

      {/* FAQ Banner / Working Hours */}
      <section className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-5">
        <div className="flex items-start gap-3.5">
          <Clock className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-white">
              Support Operating Hours
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Our helper assistance team is available Monday to Sunday from 8:00 AM to 10:00 PM IST. For emergency situations during an ongoing task, call support directly for immediate escalation.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ---------- Helper Component ---------- */

function SupportCard({ icon, iconBg, title, desc, href }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900 transition-all group"
    >
      <div className="flex items-center gap-3.5">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
            {title}
          </p>
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
            {desc}
          </p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-3" />
    </Link>
  );
}
