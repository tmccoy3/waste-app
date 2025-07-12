import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Waste Ops Intelligence",
  description: "Comprehensive waste management operations intelligence platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link 
          rel="stylesheet" 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" 
        />
      </head>
      <body className="font-sans antialiased">
        <div className="min-h-screen bg-background text-foreground">
          {children}
        </div>
      </body>
    </html>
  );
}
