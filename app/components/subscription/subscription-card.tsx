"use client";

import React from 'react';
import { Button } from '../../../components/ui/button';
import { STRIPE_PLANS } from '../../../lib/stripe/config';

interface SubscriptionCardProps {
  isTrialing?: boolean;
  trialDaysLeft?: number;
  isSubscribed?: boolean;
  onSubscribe: (priceId: string) => Promise<void>;
  onStartTrial: () => Promise<void>;
}

export function SubscriptionCard({
  isTrialing,
  trialDaysLeft,
  isSubscribed,
  onSubscribe,
  onStartTrial,
}: SubscriptionCardProps) {
  const [loading, setLoading] = React.useState(false);

  const handleAction = async (action: 'subscribe' | 'trial') => {
    try {
      setLoading(true);
      if (action === 'subscribe') {
        await onSubscribe(STRIPE_PLANS.MONTHLY);
      } else {
        await onStartTrial();
      }
    } catch (error) {
      console.error('Subscription action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isTrialing) {
    return (
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h3 className="text-2xl font-semibold leading-none tracking-tight mb-4">
          Trial Active
        </h3>
        <p className="text-muted-foreground mb-4">
          You have {trialDaysLeft} days left in your trial. Subscribe to continue after your trial ends.
        </p>
        <div className="flex items-center justify-between p-4 border rounded">
          <div>
            <p className="font-medium">Standard Plan</p>
            <p className="text-sm text-muted-foreground">$50/month</p>
          </div>
          <Button
            onClick={() => handleAction('subscribe')}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Subscribe'}
          </Button>
        </div>
      </div>
    );
  }

  if (isSubscribed) {
    return (
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h3 className="text-2xl font-semibold leading-none tracking-tight mb-4">
          Active Subscription
        </h3>
        <p className="text-muted-foreground mb-4">
          You have an active subscription. Enjoy full access to all features.
        </p>
        <Button
          variant="outline"
          onClick={() => window.location.href = '/dashboard-app/account'}
          className="w-full"
        >
          Manage Billing
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <h3 className="text-2xl font-semibold leading-none tracking-tight mb-4">
        Start Your Journey
      </h3>
      <p className="text-muted-foreground mb-6">
        Try Arthur AI free for 14 days. No credit card required.
      </p>
      <div className="space-y-4">
        <Button
          className="w-full"
          onClick={() => handleAction('trial')}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Start Free Trial'}
        </Button>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or subscribe now</span>
          </div>
        </div>
        <div className="flex items-center justify-between p-4 border rounded">
          <div>
            <p className="font-medium">Standard Plan</p>
            <p className="text-sm text-muted-foreground">$50/month</p>
          </div>
          <Button
            onClick={() => handleAction('subscribe')}
            disabled={loading}
            variant="outline"
          >
            Subscribe
          </Button>
        </div>
      </div>
    </div>
  );
} 