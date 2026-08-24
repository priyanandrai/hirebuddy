"use client";

import { SessionProvider } from "next-auth/react";
import { createContext, useEffect, useState } from "react";

export const ThemeContext = createContext({ theme: "dark", toggleTheme: () => {} });

export default function Providers({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    const saved = localStorage.getItem("hb_theme");
    if (saved) return saved;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    try {
      localStorage.setItem("hb_theme", theme);
    } catch (e) {}
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <SessionProvider>{children}</SessionProvider>
    </ThemeContext.Provider>
  );
}
