"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { SubscriptionCard } from '../../../components/subscription/subscription-card';
import { useAuth } from '../../context/auth-context';

export default function SubscriptionPage() {
  const { user } = useAuth();
  const router = useRouter();

  const handleSubscribe = async (priceId: string): Promise<void> => {
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId: user?.uid,
        }),
      });

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
    }
  };

  const handleStartTrial = async (): Promise<void> => {
    try {
      const response = await fetch('/api/stripe/start-trial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.uid,
        }),
      });

      if (response.ok) {
        router.push('/dashboard-app');
      }
    } catch (error) {
      console.error('Failed to start trial:', error);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
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
      />
    </div>
  );
} 