"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Locale, locales } from "../locales";
import { notFound } from "next/navigation";

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

  // This component won't render visibly since it redirects immediately
  return null;
} 