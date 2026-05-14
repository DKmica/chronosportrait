import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, Zap, Check, ArrowLeft, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const CREDIT_PACKS = [
  { id: 'credits_10', credits: 10, price: '$4.99', priceNum: 499, popular: false },
  { id: 'credits_25', credits: 25, price: '$9.99', priceNum: 999, popular: true, badge: 'Popular' },
  { id: 'credits_75', credits: 75, price: '$19.99', priceNum: 1999, popular: false },
  { id: 'credits_200', credits: 200, price: '$39.99', priceNum: 3999, popular: false, badge: 'Best Value' },
];

const CREDIT_COSTS = [
  { label: 'Standard image', cost: 1 },
  { label: 'HD image', cost: 2 },
  { label: 'Group image (2–6 people)', cost: 2 },
  { label: 'Cinematic video', cost: 5 },
  { label: '12-image avatar pack', cost: 8 },
  { label: 'Couples pack', cost: 6 },
];

const PRO_FEATURES = [
  'HD downloads, no watermark',
  'All eras unlocked',
  'Couples & Group mode always on',
  'Priority AI generation',
  'Private generations',
  'Weekly viral era packs',
  '100 transformations/month',
];

export default function Pricing() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState('monthly');
  const [upgrading, setUpgrading] = useState(false);
  const [buyingPack, setBuyingPack] = useState(null);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const handleUpgrade = async () => {
    if (window.self !== window.top) {
      alert('Checkout is only available from the published app.');
      return;
    }
    setUpgrading(true);
    const plan = billing === 'yearly' ? 'pro_yearly' : 'pro_monthly';
    const res = await base44.functions.invoke('createCheckoutSession', {
      success_url: `${window.location.origin}/settings?upgraded=true`,
      cancel_url: `${window.location.origin}/pricing`,
      plan,
    });
    if (res.data?.url) window.location.href = res.data.url;
    setUpgrading(false);
  };

  const handleBuyCredits = async (pack) => {
    if (window.self !== window.top) {
      alert('Checkout is only available from the published app.');
      return;
    }
    setBuyingPack(pack.id);
    const res = await base44.functions.invoke('createCheckoutSession', {
      success_url: `${window.location.origin}/settings?credits=true`,
      cancel_url: `${window.location.origin}/pricing`,
      plan: pack.id,
    });
    if (res.data?.url) window.location.href = res.data.url;
    setBuyingPack(null);
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <div className="px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-display text-xl font-bold text-foreground">Plans & Credits</h1>
      </div>

      <div className="px-5 space-y-6">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="text-center py-4">
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">Unlock Your Full Potential</h2>
          <p className="text-muted-foreground text-sm">Upgrade for HD portraits, all eras, and unlimited creativity.</p>
        </motion.div>

        {/* Billing toggle */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="flex gap-2 p-1 rounded-xl bg-muted/50 w-fit mx-auto">
          {['monthly', 'yearly'].map(b => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all relative ${
                billing === b ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              {b === 'yearly' && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                  Save 33%
                </span>
              )}
              {b.charAt(0).toUpperCase() + b.slice(1)}
            </button>
          ))}
        </motion.div>

        {/* Pro plan card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl border-2 border-primary/60 bg-gradient-to-br from-primary/10 to-accent/10 p-5 relative overflow-hidden">
          <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
            <Crown className="w-3 h-3" /> Pro
          </div>
          <div className="mb-4">
            <div className="flex items-end gap-2">
              <span className="font-display text-3xl font-bold text-foreground">
                {billing === 'yearly' ? '$6.67' : '$9.99'}
              </span>
              <span className="text-muted-foreground text-sm mb-1">/month</span>
            </div>
            {billing === 'yearly' && (
              <p className="text-xs text-primary font-semibold mt-0.5">Billed $79.99/year — save $39.89</p>
            )}
          </div>
          <ul className="space-y-2 mb-5">
            {PRO_FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <Button
            onClick={handleUpgrade}
            disabled={upgrading}
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2"
          >
            <Crown className="w-4 h-4" />
            {upgrading ? 'Redirecting...' : `Upgrade to Pro — ${billing === 'yearly' ? '$79.99/yr' : '$9.99/mo'}`}
          </Button>
        </motion.div>

        {/* Free plan */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Free Plan</h3>
            <span className="text-xs font-bold text-muted-foreground px-2 py-1 rounded-full bg-muted">$0</span>
          </div>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-muted-foreground" /> 3 transformations/day</li>
            <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-muted-foreground" /> Earn bonus via sharing & referrals</li>
            <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-muted-foreground" /> Community sharing</li>
            <li className="flex items-center gap-2 text-muted-foreground/50"><span className="w-3.5 h-3.5 text-center">×</span> HD downloads (watermarked)</li>
            <li className="flex items-center gap-2 text-muted-foreground/50"><span className="w-3.5 h-3.5 text-center">×</span> Video generation</li>
          </ul>
        </motion.div>

        {/* Credits section */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-primary" />
            <h3 className="font-display text-base font-semibold text-foreground">Credit Packs</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Buy credits to use for premium features without a subscription.</p>
          <div className="grid grid-cols-2 gap-3">
            {CREDIT_PACKS.map((pack, i) => (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className={`relative rounded-xl border p-4 flex flex-col gap-1 ${
                  pack.popular ? 'border-primary/60 bg-primary/8' : 'border-border bg-card'
                }`}
              >
                {pack.badge && (
                  <span className="absolute -top-2 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                    {pack.badge}
                  </span>
                )}
                <div className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  <span className="font-bold text-foreground">{pack.credits}</span>
                  <span className="text-xs text-muted-foreground">credits</span>
                </div>
                <p className="font-display text-lg font-bold text-foreground">{pack.price}</p>
                <p className="text-[10px] text-muted-foreground">${(pack.priceNum / pack.credits / 100).toFixed(2)}/credit</p>
                <Button
                  size="sm"
                  onClick={() => handleBuyCredits(pack)}
                  disabled={buyingPack === pack.id}
                  className="w-full mt-2 h-8 rounded-lg text-xs font-semibold"
                >
                  {buyingPack === pack.id ? 'Loading...' : 'Buy'}
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Credit cost reference */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-primary" /> Credit Costs
          </h3>
          <div className="space-y-2">
            {CREDIT_COSTS.map(({ label, cost }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <Zap className="w-3 h-3 text-primary" />{cost}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground pb-4">
          Payments processed securely by Stripe. Cancel anytime.{' '}
          <button className="underline" onClick={() => navigate('/legal')}>Terms & Privacy</button>
        </p>
      </div>
    </div>
  );
}