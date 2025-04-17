import { locales, defaultLocale, Locale } from '../locales';

// Storage key for language preference
const LANGUAGE_PREFERENCE_KEY = 'arthur_language_preference';

/**
 * Detects the user's preferred language from browser settings
 * and maps it to one of our supported locales.
 * @returns The detected locale or default locale if no match
 */
export function detectUserLanguage(): Locale {
  // Only run on client-side
  if (typeof window === 'undefined') {
    return defaultLocale;
  }

  // First check if user has a saved preference
  const savedPreference = getSavedLanguagePreference();
  if (savedPreference) {
    return savedPreference;
  }

  // Get browser language (returns formats like 'en-US', 'pt-BR', etc.)
  const browserLang = navigator.language || (navigator as any).userLanguage;
  
  // Extract the primary language code (e.g., 'en' from 'en-US')
  const primaryLang = browserLang.split('-')[0].toLowerCase();
  
  // Check if we support this language
  const matchedLocale = locales.find(locale => locale === primaryLang);
  
  return matchedLocale || defaultLocale;
}

/**
 * Saves the user's language preference to localStorage
 * @param locale The locale to save as preference
 */
export function saveLanguagePreference(locale: Locale): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(LANGUAGE_PREFERENCE_KEY, locale);
  } catch (error) {
    console.error('Failed to save language preference:', error);
  }
}

/**
 * Retrieves the user's saved language preference
 * @returns The saved locale or null if not found
 */
export function getSavedLanguagePreference(): Locale | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    const savedLocale = localStorage.getItem(LANGUAGE_PREFERENCE_KEY) as Locale | null;
    
    // Verify it's a valid locale
    if (savedLocale && locales.includes(savedLocale as any)) {
      return savedLocale;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to retrieve language preference:', error);
    return null;
  }
} 