import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, ChevronRight, Snowflake, ChevronDown, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import StreakCalendar from './StreakCalendar';

const CHALLENGES = [
  { text: "Turn your crew into Wild West outlaws", era: "wild_west" },
  { text: "Find your villain era", era: "custom" },
  { text: "Create a Prohibition couple portrait", era: "1920s" },
  { text: "Transform into a Greek deity", era: "ancient_greek" },
  { text: "Make your best friend group album cover", era: "custom" },
  { text: "Become a Viking warrior", era: "viking" },
  { text: "Step into the Renaissance as royalty", era: "renaissance" },
  { text: "Go full Sci-Fi — 2150 edition", era: "sci_fi" },
];

function getTodaysChallenge() {
  const day = Math.floor(Date.now() / 86400000);
  return CHALLENGES[day % CHALLENGES.length];
}

const FREEZE_COST = 50; // credits

export default function DailyChallenge({ profile, onProfileUpdate }) {
  const navigate = useNavigate();
  const challenge = getTodaysChallenge();
  const streak = profile?.streak_days || 0;
  const freezes = profile?.streak_freezes || 0;
  const credits = profile?.credits || 0;
  const isPro = profile?.plan && profile.plan !== 'free';

  const [expanded, setExpanded] = useState(false);
  const [buyingFreeze, setBuyingFreeze] = useState(false);
  const [freezeMsg, setFreezeMsg] = useState(null);

  const streakReward = streak >= 30
    ? '🎥 Free video generation unlocked!'
    : streak >= 14
    ? '🎨 Avatar pack discount unlocked!'
    : streak >= 7
    ? '🖼️ Free HD unlock at 7 days!'
    : streak >= 3
    ? '🎁 Bonus transformation at 3 days!'
    : `${3 - streak} more day${3 - streak !== 1 ? 's' : ''} for a bonus`;

  const today = new Date().toISOString().split('T')[0];
  const completedToday = profile?.challenge_completed_date === today
    || profile?.last_transform_date === today;

  const handleBuyFreeze = async () => {
    if (!profile || credits < FREEZE_COST) return;
    setBuyingFreeze(true);
    setFreezeMsg(null);
    await base44.entities.UserProfile.update(profile.id, {
      credits: credits - FREEZE_COST,
      streak_freezes: freezes + 1,
    });
    setFreezeMsg('Streak Freeze added!');
    setBuyingFreeze(false);
    if (onProfileUpdate) onProfileUpdate();
  };

  const handleUseFreeze = async () => {
    if (!profile || freezes < 1) return;
    setBuyingFreeze(true);
    setFreezeMsg(null);
    await base44.entities.UserProfile.update(profile.id, {
      streak_freezes: freezes - 1,
      streak_freeze_used_date: today,
    });
    setFreezeMsg('Freeze used! Streak protected for today.');
    setBuyingFreeze(false);
    if (onProfileUpdate) onProfileUpdate();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-5 mb-4 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 to-accent/10 overflow-hidden"
    >
      {/* Main row */}
      <div
        className="p-4 cursor-pointer active:scale-[0.98] transition-transform"
        onClick={() => navigate(`/?era=${challenge.era}`)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <Trophy className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Daily Challenge</span>
              {completedToday && (
                <span className="text-xs font-bold text-green-400 uppercase tracking-wider ml-1">✓ Done!</span>
              )}
            </div>
            <p className="text-sm font-semibold text-foreground leading-snug">{challenge.text}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-sm text-muted-foreground">
                {streak > 0 ? `${streak}-day streak — ` : ''}{streakReward}
              </span>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
            className="p-1 -mr-1 flex-shrink-0"
          >
            <ChevronDown className={`w-4 h-4 text-primary transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expanded: calendar + freeze */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-primary/20 pt-3">
              {/* 7-day calendar */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Last 7 Days
                </p>
                <StreakCalendar profile={profile} />
              </div>

              {/* Streak freeze section */}
              <div className="rounded-xl bg-secondary/50 border border-border p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Snowflake className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-semibold text-foreground">Streak Freeze</span>
                    {freezes > 0 && (
                      <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-semibold">
                        ×{freezes}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Protects your streak if you miss a day. Each freeze costs {FREEZE_COST} credits.
                </p>

                {freezeMsg && (
                  <p className="text-xs text-green-400 font-semibold mb-2">{freezeMsg}</p>
                )}

                <div className="flex gap-2">
                  {/* Buy a freeze */}
                  {isPro ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={credits < FREEZE_COST || buyingFreeze}
                      onClick={handleBuyFreeze}
                      className="flex-1 h-8 text-xs gap-1.5 border-blue-400/40 text-blue-300 hover:bg-blue-500/10"
                    >
                      <Zap className="w-3 h-3" />
                      Buy Freeze ({FREEZE_COST} credits)
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate('/pricing')}
                      className="flex-1 h-8 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                    >
                      Pro only — Upgrade
                    </Button>
                  )}

                  {/* Use a freeze */}
                  {freezes > 0 && !completedToday && (
                    <Button
                      size="sm"
                      disabled={buyingFreeze}
                      onClick={handleUseFreeze}
                      className="flex-1 h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Snowflake className="w-3 h-3" />
                      Use Freeze Today
                    </Button>
                  )}
                </div>

                {credits < FREEZE_COST && isPro && (
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Not enough credits.{' '}
                    <button onClick={() => navigate('/pricing')} className="text-primary underline">
                      Buy credits →
                    </button>
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}