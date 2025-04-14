"use client";

import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { toast } from 'sonner';

interface ManageSubscriptionProps {
  customerId?: string;
  isSubscribed?: boolean;
  isCanceled?: boolean;
  userId: string;
}

export function ManageSubscription({
  customerId,
  isSubscribed,
  isCanceled,
  userId
}: ManageSubscriptionProps) {
  const [loading, setLoading] = useState(false);

  const handleManageSubscription = async () => {
    try {
      setLoading(true);
      
      // Make sure we have a userId
      if (!userId) {
        toast.error("User ID is required to manage subscription");
        return;
      }
      
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create portal session');
      }

      const { url } = await response.json();
      if (!url) {
        throw new Error('No portal URL received');
      }

      // Redirect to Stripe Customer Portal
      window.location.href = url;
    } catch (error) {
      console.error('Failed to create portal session:', error);
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // If user has no subscription, don't show the management button
  if (!isSubscribed && !customerId) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <h3 className="text-xl font-semibold leading-none tracking-tight mb-4">
        Subscription Management
      </h3>
      
      <div className="mb-6">
        <p className="text-muted-foreground mb-2">
          {isSubscribed 
            ? isCanceled 
              ? "Your subscription has been canceled but is still active until the end of the current billing period." 
              : "You have an active subscription."
            : "You don't have an active subscription."}
        </p>
        
        {customerId && (
          <p className="text-sm text-muted-foreground">
            Manage your subscription to update payment methods, billing information, or cancel your plan.
          </p>
        )}
      </div>
      
      <Button
        onClick={handleManageSubscription}
        disabled={loading}
        variant="outline"
        className="w-full"
      >
        {loading ? 'Loading...' : 'Manage Subscription'}
      </Button>
    </div>
  );
} 