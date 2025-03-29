"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/auth-context';
import { toast } from 'sonner';

interface SubscriptionCheckProps {
  children: React.ReactNode;
}

export default function SubscriptionCheck({ children }: SubscriptionCheckProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (authLoading) return;
      
      if (!user) {
        router.push('/auth/signin');
        return;
      }

      // TEMPORARY: Skip subscription check and grant access
      console.log('⚠️ Subscription check bypassed temporarily');
      setLoading(false);
    };

    checkAuth();
  }, [user, router, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">
            {authLoading ? "Checking authentication..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 