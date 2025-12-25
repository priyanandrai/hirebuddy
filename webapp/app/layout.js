import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import "./globals.css";

export const metadata = {
  title: "HireBuddy",
  description: "Hirebuddy app ",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <div className="flex h-screen">
          {/* <Sidebar /> */}
          <div className="flex flex-col flex-1">
            {/* <Header /> */}
            <main className="p-6 overflow-y-auto">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
