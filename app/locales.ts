// locales.ts
export const locales = ['en', 'es', 'ur', 'fr', 'ar', 'hi', 'vi', 'pt'] as const;
export type Locale = typeof locales[number];
export const defaultLocale: Locale = 'en'; 