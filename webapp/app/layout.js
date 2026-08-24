
import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "HireBuddy",
  description: "Hirebuddy app: Help for daily life ",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <Providers>
          <main className="overflow-y-auto">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
