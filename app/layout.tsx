import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/auth-context";
import { PreferencesProvider } from "./context/preferences-context";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

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
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster position="top-right" closeButton />
              <Analytics />
            </ThemeProvider>
          </PreferencesProvider>
        </AuthProvider>
      </body>
    </html>
  );
} 