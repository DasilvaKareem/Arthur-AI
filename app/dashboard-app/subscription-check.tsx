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
  const [checkAttempts, setCheckAttempts] = React.useState(0);

  useEffect(() => {
    const checkSubscription = async () => {
      if (authLoading) return;
      
      if (!user) {
        router.push('/auth/signin');
        return;
      }

      try {
        // Add timeout to the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(`/api/stripe/check-subscription/${user.uid}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error('Failed to check subscription status');
        }
        
        const data = await response.json();

        if (!data.hasAccess) {
          router.push('/dashboard-app/subscription');
          return;
        }

        setLoading(false);
      } catch (error: any) {
        console.error('Error checking subscription:', error);
        
        // Handle timeout specifically
        if (error.name === 'AbortError') {
          if (checkAttempts < 2) {
            // Retry up to 2 times
            setCheckAttempts(prev => prev + 1);
            return;
          }
          toast.error('Subscription check timed out. Please try again later.');
        }

        // After 3 attempts or other errors, redirect to subscription page
        router.push('/dashboard-app/subscription');
      }
    };

    checkSubscription();
  }, [user, router, authLoading, checkAttempts]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">
            {authLoading ? "Checking authentication..." : `Checking subscription status${checkAttempts > 0 ? ` (Attempt ${checkAttempts + 1}/3)` : ''}...`}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 