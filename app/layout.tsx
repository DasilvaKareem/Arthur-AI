import React from "react";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";
import { Toaster } from "sonner";

const montserrat = Montserrat({
  subsets: ['latin'],
  // Optionally, add weights if needed
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: "Arthur AI - Conversational AI Assistant",
  description: "Chat with a powerful AI assistant powered by state-of-the-art models",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${montserrat.className} flex flex-col h-full`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-right" closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
} 