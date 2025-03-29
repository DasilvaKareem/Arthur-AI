import Stripe from 'stripe';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      STRIPE_SECRET_KEY: string;
      NEXT_PUBLIC_APP_URL: string;
    }
  }
}

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is not defined');
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

// Initialize Stripe with the secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-08-16',
});

// Log partial key for verification
console.log('Stripe initialized with key starting with:', process.env.STRIPE_SECRET_KEY.substring(0, 8));

export const STRIPE_PLANS = {
  MONTHLY: 'price_1R7vgwQE86fpZdRU0QCDQNQ9',
  YEARLY: 'price_1R7viVQE86fpZdRU5YG3GIfH'
} as const; 