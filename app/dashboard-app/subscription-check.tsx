"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/auth-context';

interface SubscriptionCheckProps {
  children: React.ReactNode;
}

export default function SubscriptionCheck({ children }: SubscriptionCheckProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) return;

      try {
        const response = await fetch(`/api/stripe/check-subscription/${user.uid}`);
        const data = await response.json();

        if (!data.hasAccess) {
          router.push('/dashboard-app/subscription');
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error('Error checking subscription:', error);
        // On error, we might want to show the content rather than blocking access
        setLoading(false);
      }
    };

    checkSubscription();
  }, [user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-primary">
          Checking subscription status...
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 