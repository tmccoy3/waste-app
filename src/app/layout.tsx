import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/sidebar";
import { DashboardNavigation } from "@/components/DashboardNavigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WasteOps Intelligence",
  description: "Advanced waste management operations intelligence platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background`}>
        <div className="min-h-screen bg-background">
          <Sidebar />
          <main className="ml-64 min-h-screen">
            <DashboardNavigation />
            <div className="p-6 space-y-6">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
