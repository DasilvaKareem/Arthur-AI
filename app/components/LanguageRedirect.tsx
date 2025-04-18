"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { detectUserLanguage } from '../utils/languageDetection';
import { defaultLocale } from '../locales';

interface LanguageRedirectProps {
  children: React.ReactNode;
}

/**
 * Component that automatically redirects users to their preferred language path
 * Only redirects from the root path (/) to prevent unwanted redirects
 */
export function LanguageRedirect({ children }: LanguageRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;
    
    // Only redirect if we're at the root path
    if (window.location.pathname === '/') {
      const detectedLocale = detectUserLanguage();
      
      // No need to redirect if detected locale is the default
      if (detectedLocale !== defaultLocale) {
        router.push(`/${detectedLocale}`);
      }
    }
  }, [router]);

  return <>{children}</>;
} 