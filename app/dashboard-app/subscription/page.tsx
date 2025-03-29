"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SubscriptionCard } from '../../../components/subscription/subscription-card';
import { useAuth } from '../../context/auth-context';

export default function SubscriptionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (priceId: string): Promise<void> => {
    try {
      setError(null);
      setLoading(true);

      if (!user?.uid) {
        throw new Error('Please sign in to subscribe');
      }

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId: user.uid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      if (!url) {
        throw new Error('No checkout URL received');
      }

      window.location.href = url;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = async (): Promise<void> => {
    try {
      setError(null);
      setLoading(true);

      if (!user?.uid) {
        throw new Error('Please sign in to start trial');
      }

      const response = await fetch('/api/stripe/start-trial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start trial');
      }

      router.push('/dashboard-app');
    } catch (error) {
      console.error('Failed to start trial:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {error}
        </div>
      )}
      <SubscriptionCard
        title="Premium Plan"
        price={10}
        interval="month"
        features={[
          "Unlimited conversations",
          "Priority support",
          "Advanced features",
          "Custom integrations"
        ]}
        onSubscribe={handleSubscribe}
        onStartTrial={handleStartTrial}
        loading={loading}
      />
    </div>
  );
} 