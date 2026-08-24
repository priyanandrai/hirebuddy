"use client";

import { useContext } from "react";
import { ThemeContext } from "../../providers";

export default function DashboardSettings() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 px-6 py-8 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-4xl">
        <section className="mb-6 rounded-[1.5rem] border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-6 shadow-md dark:shadow-2xl">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Settings</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Control your account and application preferences.</p>
        </section>

        <section className="rounded-[1.5rem] border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-6 shadow-md dark:shadow-2xl">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-200">Appearance</h2>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-white">Theme</p>
              <p className="text-sm text-slate-300">Choose between light and dark themes for the app.</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600 dark:text-slate-300">{theme === "dark" ? "Dark" : "Light"}</span>
              <button
                onClick={toggleTheme}
                className="rounded-full bg-slate-700 text-white px-3 py-2 text-sm hover:bg-slate-600 dark:bg-slate-700"
              >
                Toggle
              </button>
            </div>
          </div>

          <div className="mt-6">
            <div className="rounded-md border border-slate-700 bg-slate-800/60 p-4 text-sm text-slate-100">
              <p className="font-medium">Preview</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded bg-blue-500" />
                <div>
                  <p className="text-sm">Current theme: <span className="font-semibold">{theme}</span></p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
