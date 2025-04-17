import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThirdwebClientProvider from "../components/ThirdwebClientProvider";

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
        <ThirdwebClientProvider>
          {children}
        </ThirdwebClientProvider>
      </body>
    </html>
  );
} 