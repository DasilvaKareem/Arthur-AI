'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '../components/ui/button';
import { Logo } from '../components/ui/logo';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#e0e8ff] via-[#f5f7ff] to-white dark:bg-gradient-to-b dark:from-[#5f7fc5] dark:via-[#0a0e2a] dark:to-[#0a0e2a]">
      <div className="container flex flex-col items-center justify-center px-5 text-center">
        <Logo className="w-16 h-16 mb-8 animate-float" />
        
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-600">
            Something went wrong
          </span>
        </h1>
        
        <p className="mt-6 text-xl text-muted-foreground max-w-md mx-auto">
          Sorry, an unexpected error occurred.
        </p>
        
        <div className="mt-8 flex gap-4">
          <Button size="lg" className="text-base" onClick={reset}>
            Try Again
          </Button>
          <Link href="/">
            <Button size="lg" variant="outline" className="text-base">
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 