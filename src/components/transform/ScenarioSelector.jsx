import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

/**
 * Generic scenario selector for Kids and Pet modes.
 * scenarios: array of { id, label, emoji, prompt }
 */
export default function ScenarioSelector({ scenarios, selected, onSelect, customText, onCustomTextChange, label = 'Choose a Scenario' }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {scenarios.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className={`relative flex items-center gap-2 px-3 py-3 rounded-xl border text-left transition-all ${
              selected?.id === s.id
                ? 'border-primary bg-primary/15 text-foreground'
                : 'border-border bg-card/50 text-muted-foreground hover:border-primary/40 hover:bg-primary/5'
            }`}
          >
            <span className="text-xl flex-shrink-0">{s.emoji}</span>
            <span className="text-xs font-semibold leading-tight">{s.label}</span>
            {selected?.id === s.id && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-primary-foreground" />
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {selected?.id === 'custom' && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-3">
            <textarea
              value={customText}
              onChange={(e) => onCustomTextChange(e.target.value)}
              placeholder="Describe the scene… e.g. 'A puppy dressed as a medieval wizard casting spells'"
              className="w-full rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
              rows={3}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}