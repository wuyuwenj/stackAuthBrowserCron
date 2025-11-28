import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
  typescript: true,
});

// Plan configuration
export const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    maxTasks: 2,
    maxRunsPerMonth: 15,
    features: ['2 tasks', '15 runs/month', 'Community support', 'Basic scheduling'],
  },
  PRO: {
    name: 'Pro',
    price: 9,
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    maxTasks: 10,
    maxRunsPerMonth: 100,
    features: ['10 tasks', '100 runs/month', 'Email support', 'Advanced scheduling', 'API access'],
  },
  PREMIUM: {
    name: 'Premium',
    price: 19,
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID!,
    maxTasks: 50,
    maxRunsPerMonth: 300,
    features: ['50 tasks', '300 runs/month', 'Priority support', 'Custom integrations', 'Dedicated support', 'SLA guarantee'],
  },
} as const;

export type PlanType = keyof typeof PLANS;
