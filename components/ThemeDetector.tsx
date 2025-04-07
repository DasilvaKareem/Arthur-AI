"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

export default function ThemeDetector() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // Force update document class when theme changes
    if (resolvedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [resolvedTheme]);

  return null; // This component doesn't render anything
} 