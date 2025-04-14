"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OldAccountPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the new account page
    router.push('/account');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4 mx-auto"></div>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
} 