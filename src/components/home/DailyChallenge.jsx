import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Flame, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

export default function DailyChallenge({ profile }) {
  const navigate = useNavigate();
  const challenge = getTodaysChallenge();
  const streak = profile?.streak_days || 0;

  const streakReward = streak >= 30
    ? 'Free video generation unlocked!'
    : streak >= 14
    ? 'Avatar pack discount unlocked!'
    : streak >= 7
    ? 'Free HD unlock at 7 days!'
    : streak >= 3
    ? 'Bonus transformation at 3 days!'
    : `${3 - streak} more day${3 - streak !== 1 ? 's' : ''} for a bonus`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate(`/?era=${challenge.era}`)}
      className="mx-5 mb-4 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 to-accent/10 p-4 cursor-pointer active:scale-[0.98] transition-transform"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Trophy className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Daily Challenge</span>
          </div>
          <p className="text-sm font-semibold text-foreground leading-snug">{challenge.text}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs text-muted-foreground">
              {streak > 0 ? `${streak}-day streak — ` : ''}{streakReward}
            </span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
      </div>
    </motion.div>
  );
}