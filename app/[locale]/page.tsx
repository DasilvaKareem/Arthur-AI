"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Locale, locales } from "../locales";
import { notFound } from "next/navigation";
import Particles from "../../components/Particle";

export default function LocalizedHomePage({
  params,
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const { locale } = params;

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Redirect to the home slug within the locale
  useEffect(() => {
    router.push(`/${locale}/home`);
  }, [locale, router]);

  // Include particles while redirecting
  return (
    <div className="min-h-screen bg-background relative">
      <Particles />
      <div className="fixed top-0 left-0 w-full h-full z-[-1] pointer-events-none bg-gradient-to-b from-[#e0e8ff]/50 via-[#f5f7ff]/30 to-white/20 dark:bg-gradient-to-b dark:from-[#5f7fc5]/50 dark:via-[#0a0e2a]/30 dark:to-[#0a0e2a]/20" />
    </div>
  );
} 