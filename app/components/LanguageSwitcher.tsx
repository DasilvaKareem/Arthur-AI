"use client";

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { locales, Locale } from '../locales';
import { saveLanguagePreference } from '../utils/languageDetection';

const LANGUAGE_NAMES: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  ur: 'اردو',
  fr: 'Français',
  ar: 'العربية',
  hi: 'हिन्दी',
  vi: 'Tiếng Việt',
  pt: 'Português'
};

export function LanguageSwitcher() {
  const router = useRouter();
  const params = useParams();
  const [currentLocale, setCurrentLocale] = useState<Locale>('en');
  
  // Extract current locale from URL
  useEffect(() => {
    if (params && params.locale) {
      const localeParam = params.locale as string;
      if (locales.includes(localeParam as Locale)) {
        setCurrentLocale(localeParam as Locale);
      }
    }
  }, [params]);

  // Handle language change
  const handleLanguageChange = (newLocale: Locale) => {
    // Save preference
    saveLanguagePreference(newLocale);
    
    // Redirect to the same page but with new locale
    const path = window.location.pathname;
    const currentLocaleRegex = new RegExp(`^/(${locales.join('|')})/`);
    
    if (currentLocaleRegex.test(path)) {
      // Replace current locale with new one
      const newPath = path.replace(currentLocaleRegex, `/${newLocale}/`);
      router.push(newPath);
    } else {
      // Fallback if path doesn't match expected pattern
      router.push(`/${newLocale}/home`);
    }
  };

  return (
    <Select value={currentLocale} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select Language" />
      </SelectTrigger>
      <SelectContent>
        {locales.map((locale) => (
          <SelectItem key={locale} value={locale}>
            {LANGUAGE_NAMES[locale]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 