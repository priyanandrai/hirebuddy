
import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "HireBuddy",
  description: "Hirebuddy app: Help for daily life ",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white">
        <Providers>
          <main className="overflow-y-auto">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
