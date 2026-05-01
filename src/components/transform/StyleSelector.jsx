import React from 'react';
import { motion } from 'framer-motion';

const INTENSITIES = [
  {
    id: 'subtle',
    label: 'Subtle',
    sub: 'Photorealistic',
    emoji: '📷',
    description: 'Looks like a real photo',
  },
  {
    id: 'balanced',
    label: 'Balanced',
    sub: 'Classic',
    emoji: '✨',
    description: 'Best of both worlds',
  },
  {
    id: 'artistic',
    label: 'Artistic',
    sub: 'Painterly',
    emoji: '🎨',
    description: 'Bold, expressive style',
  },
];

export const STYLE_PROMPTS = {
  subtle: 'Photorealistic, subtle transformation, natural skin tones, sharp details, cinematic photography, DSLR quality.',
  balanced: 'Semi-realistic, cinematic color grading, detailed, high quality, film aesthetic.',
  artistic: 'Painterly art style, expressive brushstrokes, dramatic color palette, digital painting, artistic masterpiece, oil painting aesthetic.',
};

export default function StyleSelector({ value, onChange }) {
  return (
    <div className="space-y-2">
      <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider px-5">
        Style &amp; Intensity
      </h2>
      <div className="flex gap-2.5 px-5">
        {INTENSITIES.map((opt) => {
          const isSelected = value === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onChange(opt.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-2xl border transition-all duration-200 ${
                isSelected
                  ? 'bg-primary/15 border-primary text-primary'
                  : 'bg-muted/40 border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              <span className="text-xl leading-none">{opt.emoji}</span>
              <span className="text-xs font-bold leading-tight">{opt.label}</span>
              <span className={`text-[10px] leading-tight ${isSelected ? 'text-primary/80' : 'text-muted-foreground'}`}>
                {opt.sub}
              </span>
              {isSelected && (
                <motion.div
                  layoutId="style-indicator"
                  className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}