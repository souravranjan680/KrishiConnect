import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import FloatingChatBot from "@/components/FloatingChatBot";
import { LanguageProvider } from "@/components/LanguageProvider";


export const metadata: Metadata = {
  title: "KrishiConnect — AI Crop Advisor",
  description: "AI-powered crop recommendation for Indian farmers — fast, free, and mobile-first.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KrishiConnect",
  },
};

export const viewport: Viewport = {
  themeColor: "#022c22",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body className="flex flex-col min-h-screen" style={{ background: "#ffffff" }}>
        <LanguageProvider>
          <Navbar />
          <div className="flex-1 pb-16 sm:pb-0">{children}</div>
          <Footer />
          <BottomNav />
          <FloatingChatBot />
        </LanguageProvider>
      </body>
    </html>
  );
}
