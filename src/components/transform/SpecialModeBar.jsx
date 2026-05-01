import React from 'react';
import { motion } from 'framer-motion';

export default function SpecialModeBar({ modes, selectedMode, onSelect }) {
  return (
    <div className="flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-hide">
      {modes.map((mode, index) => {
        const isSelected = selectedMode === mode.id;
        return (
          <motion.button
            key={mode.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.06 }}
            onClick={() => onSelect(mode.id)}
            className={`flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl border transition-all duration-200 ${
              isSelected
                ? 'bg-primary/15 border-primary text-primary'
                : 'bg-muted/40 border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
            }`}
          >
            <span className="text-xl leading-none">{mode.emoji}</span>
            <span className="text-xs font-semibold whitespace-nowrap">{mode.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}