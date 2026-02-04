'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/lib/useWallet';

interface Subscription {
  tier: string;
  status: string;
  current_period_end: string;
  api_calls_used: number;
  api_calls_limit: number;
  agents_used: number;
  agents_limit: number;
}

const TIERS = [
  { name: 'Basic', price: 5, agents: 1, apiCalls: 0, features: ['1 Agent', 'Dashboard access', 'Email support'] },
  { name: 'Pro', price: 50, agents: 3, apiCalls: 100, features: ['3 Agents', '100 API calls/day', 'Priority support'] },
  { name: 'Team', price: 250, agents: 10, apiCalls: 1000, features: ['10 Agents', '1K API calls/day', 'Team dashboard'] },
  { name: 'Enterprise', price: 1000, agents: -1, apiCalls: 10000, features: ['Unlimited Agents', '10K API calls/day', 'Dedicated support'] },
  { name: 'VIP', price: 5000, agents: -1, apiCalls: -1, features: ['Unlimited Everything', 'Custom integrations', '24/7 hotline'] }
];

export default function SubscriptionPage() {
  const { connected, publicKey, balance, connect } = useWallet();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [discount, setDiscount] = useState(0);

  // Calculate discount based on token holdings
  useEffect(() => {
    if (balance >= 1000000) setDiscount(40);
    else if (balance >= 100000) setDiscount(20);
    else if (balance >= 10000) setDiscount(10);
    else setDiscount(0);
  }, [balance]);

  useEffect(() => {
    async function fetchSubscription() {
      if (!publicKey) {
        setSubscription({
          tier: 'free',
          status: 'active',
          current_period_end: '',
          api_calls_used: 0,
          api_calls_limit: 10,
          agents_used: 0,
          agents_limit: 1
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('wallet_address', publicKey)
        .single();

      if (error) {
        console.error('Error:', error);
      } else {
        setSubscription(data);
      }
      setLoading(false);
    }

    fetchSubscription();
  }, [publicKey]);

  const handleUpgrade = (tier: string) => {
    // In production, this would open Stripe checkout
    alert(`Upgrade to ${tier} - Stripe integration coming soon!`);
  };

  const getDiscountedPrice = (price: number) => {
    return Math.round(price * (1 - discount / 100));
  };

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Live Status Banner */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-center py-2 px-4 text-sm">
        <span className="font-semibold">🟢 Live</span> — Token holders get up to 40% off. <a href="/docs" className="underline">Test API</a>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">
            <span className="text-red-500">Subscription</span> Management
          </h1>
          <div className="flex gap-4">
            <a href="/" className="text-gray-400 hover:text-white">← Home</a>
            <a href="/agents" className="text-gray-400 hover:text-white">Agents</a>
          </div>
        </div>

        {/* Current Plan */}
        {subscription && (
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 mb-8">
            <h2 className="text-xl font-semibold mb-4">Current Plan</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Tier</p>
                <p className="text-2xl font-bold capitalize">{subscription.tier}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Status</p>
                <p className="text-2xl font-bold text-green-400 capitalize">{subscription.status}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">API Usage</p>
                <p className="text-2xl font-bold">
                  {subscription.api_calls_used}/{subscription.api_calls_limit === -1 ? '∞' : subscription.api_calls_limit}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Agents</p>
                <p className="text-2xl font-bold">
                  {subscription.agents_used}/{subscription.agents_limit === -1 ? '∞' : subscription.agents_limit}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Token Discount Banner */}
        {discount > 0 && (
          <div className="bg-green-900/30 border border-green-500 rounded-lg p-4 mb-8">
            <p className="text-green-300 text-center">
              🎉 You hold {balance.toLocaleString()} $KILLSWITCH - <strong>{discount}% discount</strong> applied!
            </p>
          </div>
        )}

        {discount === 0 && connected && (
          <div className="bg-purple-900/30 border border-purple-500 rounded-lg p-4 mb-8">
            <p className="text-purple-300 text-center">
              Hold 10K+ $KILLSWITCH for up to 40% off subscriptions!
              <a 
                href="https://jup.ag/tokens/56o8um92XU8QMr1FsSj4nkExEkgKe56PBTAMqCAzmoon"
                target="_blank"
                className="underline ml-2"
              >
                Buy on Jupiter
              </a>
            </p>
          </div>
        )}

        {/* Pricing Tiers */}
        <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {TIERS.map((tier) => (
            <div 
              key={tier.name}
              className={`bg-gray-900 p-6 rounded-lg border ${
                subscription?.tier === tier.name.toLowerCase() 
                  ? 'border-red-500' 
                  : 'border-gray-800'
              }`}
            >
              <h3 className="text-lg font-semibold mb-2">{tier.name}</h3>
              <div className="mb-4">
                {discount > 0 && (
                  <p className="text-gray-500 line-through text-sm">${tier.price}/mo</p>
                )}
                <p className="text-2xl font-bold">
                  ${getDiscountedPrice(tier.price)}
                  <span className="text-sm text-gray-400">/mo</span>
                </p>
              </div>
              <ul className="text-sm text-gray-400 space-y-2 mb-4">
                {tier.features.map((f, i) => (
                  <li key={i}>✓ {f}</li>
                ))}
              </ul>
              {subscription?.tier === tier.name.toLowerCase() ? (
                <button 
                  disabled
                  className="w-full bg-gray-700 text-gray-400 py-2 rounded cursor-not-allowed"
                >
                  Current Plan
                </button>
              ) : (
                <button 
                  onClick={() => handleUpgrade(tier.name)}
                  className="w-full bg-red-600 hover:bg-red-700 py-2 rounded font-semibold"
                >
                  Upgrade
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Payment Methods */}
        <div className="mt-8 bg-gray-900 p-6 rounded-lg border border-gray-800">
          <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-xl">💳</span>
              <span>Credit Card (Stripe)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">◎</span>
              <span>Solana (SOL)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">💵</span>
              <span>USDC on Solana</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}