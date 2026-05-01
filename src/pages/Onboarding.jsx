import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Clock, Share2, Camera, ArrowRight, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const SLIDES = [
  {
    id: 0,
    emoji: '🕰️',
    headline: 'Step into another timeline.',
    sub: 'Discover who you would have been across 5,000 years of history.',
    bg: 'from-amber-900/60 via-background to-background',
    accent: 'text-amber-400',
  },
  {
    id: 1,
    emoji: '🤳',
    headline: 'Upload a selfie.',
    sub: 'One photo is all it takes. Our AI reads your unique facial features and expression.',
    bg: 'from-violet-900/60 via-background to-background',
    accent: 'text-violet-400',
  },
  {
    id: 2,
    emoji: '🔮',
    headline: 'AI finds your era.',
    sub: 'Are you a Viking? A Renaissance noble? A cyberpunk rebel? Find out now.',
    bg: 'from-cyan-900/60 via-background to-background',
    accent: 'text-cyan-400',
  },
  {
    id: 3,
    emoji: '📲',
    headline: 'Share your transformation.',
    sub: 'Generate shareable portraits optimized for TikTok, Reels & Shorts. Go viral.',
    bg: 'from-rose-900/60 via-background to-background',
    accent: 'text-rose-400',
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);

  // Skip onboarding if already seen
  useEffect(() => {
    const seen = localStorage.getItem('cb_onboarding_done');
    if (seen) navigate('/', { replace: true });
  }, []);

  const handleNext = () => {
    if (step < SLIDES.length - 1) {
      setStep((s) => s + 1);
    } else {
      finish();
    }
  };

  const finish = () => {
    localStorage.setItem('cb_onboarding_done', '1');
    navigate('/', { replace: true });
  };

  const slide = SLIDES[step];

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-b ${slide.bg} transition-all duration-700`}>
      {/* Skip */}
      <div className="flex justify-end px-6 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <button onClick={finish} className="text-sm text-muted-foreground font-medium">
          Skip
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -32 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-6"
          >
            <div className="text-8xl leading-none select-none">{slide.emoji}</div>
            <h1 className={`font-display text-3xl font-bold text-foreground leading-tight`}>
              {slide.headline}
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed max-w-xs">
              {slide.sub}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 pb-8">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            onClick={() => setStep(i)}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              i === step ? 'w-8 bg-primary' : 'w-2 bg-border'
            }`}
          />
        ))}
      </div>

      {/* CTA */}
      <div className="px-6 pb-[max(2rem,env(safe-area-inset-bottom))] space-y-3">
        {step < SLIDES.length - 1 ? (
          <Button
            onClick={handleNext}
            className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base gap-2"
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </Button>
        ) : (
          <Button
            onClick={finish}
            className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Find My Timeline
          </Button>
        )}
      </div>
    </div>
  );
}