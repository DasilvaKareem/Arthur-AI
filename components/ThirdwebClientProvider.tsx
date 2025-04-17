'use client';

import React, { ReactNode } from "react";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "sonner";
import { AuthProvider } from "../app/context/auth-context";
import { PreferencesProvider } from "../app/context/preferences-context";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import dynamic from "next/dynamic";

const ThemeDetector = dynamic(() => import("./ThemeDetector"), { ssr: false });

interface ThirdwebClientProviderProps {
  children: ReactNode;
}

export default function ThirdwebClientProvider({ children }: ThirdwebClientProviderProps) {
  // Configure the blockchain network from env variable
  const activeChain = process.env.NEXT_PUBLIC_ACTIVE_CHAIN || "polygon";

  return (
    <ThirdwebProvider activeChain={activeChain}>
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
    </ThirdwebProvider>
  );
} 