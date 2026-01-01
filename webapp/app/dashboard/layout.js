"use client";

import Footer from "../components/layout/Footer";
import Header from "../components/layout/HeaderAfterlogin";



export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 pt-16">
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
