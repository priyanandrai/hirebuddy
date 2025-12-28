import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import "./globals.css";

export const metadata = {
  title: "HireBuddy",
  description: "Hirebuddy app: Help for daily life ",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        {/* <Sidebar /> */}

        {/* <Header /> */}
        <main className="overflow-y-auto">{children}</main>


      </body>
    </html>
  );
}
