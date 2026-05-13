import React from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { SPECIAL_MODES, AD_GATED_MODES } from '@/lib/specialModes';

export default function SpecialModeBar({ selectedMode, onModeSelect, userProfile }) {
  const userPlan = userProfile?.plan || 'free';

  return (
    <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-hide">
      {SPECIAL_MODES.map((mode, index) => {
        const isSelected = selectedMode === mode.id;
        const isGated = AD_GATED_MODES.includes(mode.id) && userPlan === 'free';
        return (
          <motion.button
            key={mode.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.06 }}
            onClick={() => onModeSelect(mode.id)}
            className={`relative flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl border transition-all duration-200 ${
              isSelected
                ? 'bg-primary/15 border-primary text-primary'
                : 'bg-muted/40 border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
            }`}
          >
            <span className="text-xl leading-none">{mode.emoji}</span>
            <span className="text-xs font-semibold whitespace-nowrap">{mode.label}</span>
            {isGated && !isSelected && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                <Play className="w-2.5 h-2.5 text-white fill-white" />
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}