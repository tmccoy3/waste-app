import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
// import { ThemeProvider } from "@/components/theme-provider";
import Sidebar from "@/components/sidebar";

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
  console.log('Root Layout rendering WITHOUT ThemeProvider');
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-[#ffffff] text-gray-900`}>
        {/* ThemeProvider temporarily commented out for testing */}
        {/* <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        > */}
          <div className="min-h-screen bg-[#ffffff] text-gray-900">
            <Sidebar />
            <main className="ml-64 min-h-screen p-6 bg-gray-50">
              {children}
            </main>
          </div>
        {/* </ThemeProvider> */}
      </body>
    </html>
  );
} 