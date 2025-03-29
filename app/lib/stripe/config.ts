import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is not defined');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-08-16',
  typescript: true,
});

// Log successful initialization without exposing key
console.log('Stripe has been initialized successfully');

export const STRIPE_PLANS = {
  MONTHLY: 'price_1R7vgwQE86fpZdRU0QCDQNQ9',
  YEARLY: 'price_1R7viVQE86fpZdRU5YG3GIfH'
} as const;

export interface UserSubscription {
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  stripeCurrentPeriodEnd?: number;
  isSubscribed: boolean;
  isCanceled: boolean;
  isTrialing: boolean;
  trialEnd?: number;
} 