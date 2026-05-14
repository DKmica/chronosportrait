import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Zap, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';

const FEATURES = [
  'HD downloads — no watermark',
  'All eras unlocked',
  'Couples & Group mode always on',
  'Priority AI generation',
  '100 transformations/month',
  'Cinematic video generation',
];

export default function UpgradeModal({ open, onOpenChange, featureHint }) {
  const [billing, setBilling] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleUpgrade = async () => {
    if (window.self !== window.top) {
      alert('Checkout is only available from the published app.');
      return;
    }
    setLoading(true);
    const plan = billing === 'yearly' ? 'pro_yearly' : 'pro_monthly';
    const res = await base44.functions.invoke('createCheckoutSession', {
      success_url: `${window.location.origin}/settings?upgraded=true`,
      cancel_url: window.location.href,
      plan,
    });
    if (res.data?.url) window.location.href = res.data.url;
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl border-primary/30 p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/20 to-accent/20 p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-3">
            <Crown className="w-7 h-7 text-primary" />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground">Unlock Pro</h2>
          {featureHint && (
            <p className="text-sm text-muted-foreground mt-1">{featureHint}</p>
          )}
        </div>

        <div className="p-5 space-y-4">
          {/* Features */}
          <ul className="space-y-2">
            {FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />{f}
              </li>
            ))}
          </ul>

          {/* Billing toggle */}
          <div className="flex gap-2 p-1 rounded-xl bg-muted/50">
            {[
              { id: 'monthly', label: 'Monthly', price: '$9.99/mo' },
              { id: 'yearly', label: 'Yearly', price: '$79.99/yr', badge: 'Save 33%' },
            ].map(b => (
              <button
                key={b.id}
                onClick={() => setBilling(b.id)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all relative ${
                  billing === b.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                {b.badge && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    {b.badge}
                  </span>
                )}
                {b.label}<br /><span className="font-bold">{b.price}</span>
              </button>
            ))}
          </div>

          <Button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2"
          >
            <Crown className="w-4 h-4" />
            {loading ? 'Redirecting...' : 'Upgrade to Pro'}
          </Button>

          <button
            onClick={() => { onOpenChange(false); navigate('/pricing'); }}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground underline"
          >
            See full pricing & credits
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}