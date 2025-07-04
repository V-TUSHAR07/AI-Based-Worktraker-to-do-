import "./globals.css";
import type { Metadata } from "next";
import { NavBar } from "@/components/NavBar";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Smart Todo App",
  description: "AI-powered smart todo list",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <NavBar />
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
