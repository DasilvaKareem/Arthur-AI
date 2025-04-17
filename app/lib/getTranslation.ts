import { Locale } from '../locales';

export const getTranslation = async (locale: Locale) => {
  try {
    const translations = await import(`../lib/translations/${locale}.json`);
    return translations.default;
  } catch (error) {
    console.error(`Error loading translations for locale: ${locale}`, error);
    // Fallback to English if translation is missing
    const fallbackTranslations = await import('../lib/translations/en.json');
    return fallbackTranslations.default;
  }
}; 