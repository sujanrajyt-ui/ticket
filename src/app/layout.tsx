import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { EVENT_CONFIG } from "@/config/event";
import EventConfigProvider from "@/components/EventConfigProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: `${EVENT_CONFIG.name} — Registration`,
  description: EVENT_CONFIG.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gray-950 text-white antialiased">
        <EventConfigProvider>{children}</EventConfigProvider>
      </body>
    </html>
  );
}
