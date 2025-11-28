'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { Navbar } from '@/components/Navbar';

const plans = [
  {
    name: 'Free',
    price: '$0',
    plan: 'FREE' as const,
    description: 'Perfect for testing',
    features: [
      '2 tasks',
      '15 runs/month',
      'Community support',
      'Basic scheduling',
    ],
  },
  {
    name: 'Pro',
    price: '$9',
    plan: 'PRO' as const,
    description: 'For individuals',
    features: [
      '10 tasks',
      '100 runs/month',
      'Email support',
      'Advanced scheduling',
      'API access',
    ],
    popular: true,
  },
  {
    name: 'Premium',
    price: '$19',
    plan: 'PREMIUM' as const,
    description: 'For small teams',
    features: [
      '50 tasks',
      '300 runs/month',
      'Priority support',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
    ],
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch current user
    fetch('/api/me')
      .then((res) => res.json())
      .then((data) => setUserId(data.userId))
      .catch((error) => console.error('Failed to fetch user:', error));
  }, []);

  const handleUpgrade = async (plan: 'PRO' | 'PREMIUM') => {
    if (!userId) return;
    try {
      setLoading(plan);

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, userId }),
      });

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-slate-600">
            Choose the plan that works best for you
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((planItem) => (
            <Card
              key={planItem.plan}
              className={`relative ${
                planItem.popular
                  ? 'border-indigo-600 border-2 shadow-lg'
                  : ''
              }`}
            >
              {planItem.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{planItem.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-slate-900">
                    {planItem.price}
                  </span>
                  <span className="text-slate-600">/month</span>
                </div>
                <p className="text-slate-600 mt-2">{planItem.description}</p>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-6">
                  {planItem.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check className="w-5 h-5 text-indigo-600 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {planItem.plan === 'FREE' ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled
                  >
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleUpgrade(planItem.plan as 'PRO' | 'PREMIUM')}
                    disabled={loading !== null}
                  >
                    {loading === planItem.plan ? 'Loading...' : 'Upgrade Now'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-slate-600">
            All plans include a 14-day money-back guarantee.
            <br />
            Need a custom plan?{' '}
            <a href="mailto:support@example.com" className="text-indigo-600 hover:underline">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
