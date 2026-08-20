"use client";

import Footer from "../components/layout/Footer";
import Header from "../components/layout/HeaderAfterlogin";



export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <Header />

      <main className="flex-1 pt-16 bg-slate-950">
        {children}
      </main>

      <Footer />
    </div>
  );
}
