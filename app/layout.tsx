import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/auth-context";
import { PreferencesProvider } from "./context/preferences-context";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import dynamic from "next/dynamic";

const inter = Inter({ subsets: ["latin"] });
const ThemeDetector = dynamic(() => import("../components/ThemeDetector"), { ssr: false });

export const metadata: Metadata = {
  title: "Arthur AI - AI Storytelling",
  description: "Generate Scripts, Storyboards, and Videos with Arthur AI",
  icons: {
    icon: '/icon.svg'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} flex flex-col h-full`}>
        <AuthProvider>
          <PreferencesProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              <ThemeDetector />
              {children}
              <Toaster position="top-right" closeButton />
              <Analytics />
              <SpeedInsights />
            </ThemeProvider>
          </PreferencesProvider>
        </AuthProvider>
      </body>
    </html>
  );
} 