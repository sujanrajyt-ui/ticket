import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { EVENT_CONFIG } from "@/config/event";
import EventConfigProvider from "@/components/EventConfigProvider";
import LogoOverlay from "@/components/LogoOverlay";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: `${EVENT_CONFIG.name} — Registration`,
  description: EVENT_CONFIG.description,
  formatDetection: { telephone: false },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: EVENT_CONFIG.name,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0c0516",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gray-950 text-white antialiased">
        <EventConfigProvider>
          <LogoOverlay />
          {children}
        </EventConfigProvider>
      </body>
    </html>
  );
}
