import { redirect } from 'next/navigation';
import { defaultLocale } from './locales';

/**
 * Root page that handles server-side redirection
 * 
 * This works together with our client-side LanguageRedirect component:
 * - Server first renders with default locale
 * - Then client-side detection redirects if needed
 */
export default function Home() {
  // Default server-side redirect to default locale
  // This will be overridden by client-side detection if browser language is different
  redirect(`/${defaultLocale}/home`);
}
