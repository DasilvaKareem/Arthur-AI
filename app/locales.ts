// locales.ts
export const locales = ['en', 'es', 'ur'] as const;
export type Locale = typeof locales[number];
export const defaultLocale: Locale = 'en'; 