"use client";

import Link from 'next/link';
import { Button } from '../../../components/ui/button';
import { Logo } from '../../../components/ui/logo';
import { useParams } from 'next/navigation';
import dynamic from "next/dynamic";

// Dynamic import of the Particles component
const Particles = dynamic(() => import("../../../components/Particle"), { ssr: false });

export default function SlugNotFound() {
  const params = useParams();
  const locale = params?.locale || 'en';

  return (
    <div className="relative flex-col min-h-screen">
      <Particles />
      <div className="fixed top-0 left-0 w-full h-full z-[-1] pointer-events-none bg-gradient-to-b from-[#e0e8ff] via-[#f5f7ff] to-white dark:bg-gradient-to-b dark:from-[#5f7fc5] dark:via-[#0a0e2a] dark:to-[#0a0e2a]" />
      
      <div className="flex flex-col items-center justify-center min-h-screen">
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
            <Link href={`/${locale}/home`}>
              <Button size="lg" className="text-base">
                Go Home
              </Button>
            </Link>
            <Link href={`/${locale}/contact`}>
              <Button size="lg" variant="outline" className="text-base">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 