import Link from 'next/link';
import { Button } from '../components/ui/button';
import { Logo } from '../components/ui/logo';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#e0e8ff] via-[#f5f7ff] to-white dark:bg-gradient-to-b dark:from-[#5f7fc5] dark:via-[#0a0e2a] dark:to-[#0a0e2a]">
      <div className="container flex flex-col items-center justify-center px-5 text-center">
        <Logo className="w-16 h-16 mb-8 animate-float" />
        
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-7xl">
          <span className="block">404</span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-600 mt-2 block">
            Page Not Found
          </span>
        </h1>
        
        <p className="mt-6 text-xl text-muted-foreground max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for.
        </p>
        
        <div className="mt-8 flex gap-4">
          <Link href="/">
            <Button size="lg" className="text-base">
              Go Home
            </Button>
          </Link>
          <Link href="/en/contact">
            <Button size="lg" variant="outline" className="text-base">
              Contact Support
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 