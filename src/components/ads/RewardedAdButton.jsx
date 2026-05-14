/**
 * RewardedAdButton — "Watch an ad for 1 bonus transformation"
 * Rules:
 *   - Free users only
 *   - Max 3 rewarded ads per day
 *   - Only grants reward after full ad completion
 *   - Increments bonus_transformations in UserProfile
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PlayCircle, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { showRewardedAd } from '@/lib/admob';
import { showAds } from '@/lib/appConfig';

const MAX_REWARDED_PER_DAY = 3;

export default function RewardedAdButton({ profile, onRewarded }) {
  const [loading, setLoading] = useState(false);
  const [rewarded, setRewarded] = useState(false);
  const [message, setMessage] = useState(null);

  if (!profile || !showAds(profile.plan)) return null;

  const today = new Date().toISOString().split('T')[0];
  const watchedToday = profile.last_rewarded_ad_date === today
    ? (profile.rewarded_ads_watched_today || 0)
    : 0;

  if (watchedToday >= MAX_REWARDED_PER_DAY) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-center">
        <p className="text-xs text-muted-foreground">
          You've earned all {MAX_REWARDED_PER_DAY} bonus transformations for today. Come back tomorrow!
        </p>
      </div>
    );
  }

  const handleWatch = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const { rewarded: didWatch } = await showRewardedAd(profile.plan);
      if (didWatch) {
        // Grant reward
        const newWatched = watchedToday + 1;
        await base44.entities.UserProfile.update(profile.id, {
          bonus_transformations: (profile.bonus_transformations || 0) + 1,
          rewarded_ads_watched_today: newWatched,
          last_rewarded_ad_date: today,
        });
        setRewarded(true);
        setMessage('Bonus transformation unlocked!');
        if (onRewarded) onRewarded();
      } else {
        setMessage('Ad skipped — no reward granted.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 space-y-2"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Watch an ad for a bonus</p>
          <p className="text-xs text-muted-foreground">
            {MAX_REWARDED_PER_DAY - watchedToday} of {MAX_REWARDED_PER_DAY} remaining today
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleWatch}
          disabled={loading || rewarded}
          className="gap-1.5 h-9 rounded-xl bg-primary text-primary-foreground"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : rewarded ? (
            <CheckCircle className="w-3.5 h-3.5" />
          ) : (
            <PlayCircle className="w-3.5 h-3.5" />
          )}
          {loading ? 'Loading…' : rewarded ? 'Earned!' : 'Watch Ad'}
        </Button>
      </div>
      {message && (
        <p className={`text-xs font-semibold ${rewarded ? 'text-green-400' : 'text-muted-foreground'}`}>
          {message}
        </p>
      )}
    </motion.div>
  );
}