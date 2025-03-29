import React from 'react';
import { STRIPE_PLANS } from '@/lib/stripe/config';

interface SubscriptionCardProps {
  title: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  onSubscribe: (priceId: string) => void;
  onStartTrial: () => void;
  loading?: boolean;
}

export function SubscriptionCard({
  title,
  price,
  interval,
  features,
  onSubscribe,
  onStartTrial,
  loading = false,
}: SubscriptionCardProps) {
  return (
    <div className="rounded-lg border p-6 bg-white shadow-sm">
      <h3 className="text-2xl font-semibold text-gray-900">{title}</h3>
      <div className="mt-4">
        <span className="text-4xl font-bold text-gray-900">${price}</span>
        <span className="text-gray-600">/{interval}</span>
      </div>
      <ul className="mt-6 space-y-4">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center">
            <svg
              className="h-5 w-5 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="ml-3 text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={() => onSubscribe(interval === 'month' ? STRIPE_PLANS.MONTHLY : STRIPE_PLANS.YEARLY)}
        disabled={loading}
        className={`mt-8 w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {loading ? 'Processing...' : 'Subscribe Now'}
      </button>
    </div>
  );
} 