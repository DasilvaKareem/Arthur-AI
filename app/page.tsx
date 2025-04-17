import { redirect } from 'next/navigation';
import { defaultLocale } from './locales';

export default function Home() {
  redirect(`/${defaultLocale}/home`);
}
