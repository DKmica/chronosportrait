import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronRight, User, Users, Users2, Camera, Clock, Share2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SLIDES = [
  {
    id: 0,
    icon: null,
    emoji: '⏰',
    headline: 'Step Into Any Era',
    sub: 'Upload yourself, your partner, or your whole crew and transform into cinematic portraits from history, fantasy, and pop-culture worlds.',
    bg: 'from-amber-900/60 via-background to-background',
  },
  {
    id: 1,
    icon: null,
    emoji: '🤳',
    headline: 'Choose Your Mode',
    sub: null,
    bg: 'from-violet-900/60 via-background to-background',
    modes: [
      { icon: User, label: 'Solo', sub: 'Just you' },
      { icon: Users2, label: 'Couple', sub: '2 people' },
      { icon: Users, label: 'Crew', sub: '3–6 people' },
    ],
  },
  {
    id: 2,
    icon: Camera,
    emoji: null,
    headline: 'Upload Original Photos',
    sub: 'One clear, front-facing photo per person works best.',
    bg: 'from-cyan-900/60 via-background to-background',
    tips: [
      '✓ Clear, well-lit face photo',
      '✓ Front-facing or slight angle',
      '× No sunglasses or heavy filters',
      '× No collages or group photos',
      '× No previous ChronosBooth images as input',
    ],
  },
  {
    id: 3,
    icon: null,
    emoji: '🔮',
    headline: 'Choose Your Era',
    sub: 'Pick from dozens of historical, fantasy, and pop-culture worlds — or describe your own custom era.',
    bg: 'from-rose-900/60 via-background to-background',
  },
  {
    id: 4,
    icon: Share2,
    emoji: null,
    headline: 'Generate & Go Viral',
    sub: 'Download your portrait, share it to TikTok, Instagram, Reels, or Snapchat — and earn bonus generations for every share.',
    bg: 'from-green-900/60 via-background to-background',
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem('cb_onboarding_done');
    if (seen) navigate('/', { replace: true });
  }, []);

  const finish = () => {
    localStorage.setItem('cb_onboarding_done', '1');
    navigate('/', { replace: true });
  };

  const handleNext = () => {
    if (step < SLIDES.length - 1) setStep(s => s + 1);
    else finish();
  };

  const slide = SLIDES[step];
  const SlideIcon = slide.icon;

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
            className="flex flex-col items-center gap-6 w-full"
          >
            {slide.emoji && (
              <div className="text-7xl leading-none select-none">{slide.emoji}</div>
            )}
            {SlideIcon && (
              <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center">
                <SlideIcon className="w-10 h-10 text-primary" />
              </div>
            )}

            <h1 className="font-display text-3xl font-bold text-foreground leading-tight">
              {slide.headline}
            </h1>

            {slide.sub && (
              <p className="text-muted-foreground text-base leading-relaxed max-w-xs">{slide.sub}</p>
            )}

            {/* Modes grid */}
            {slide.modes && (
              <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
                {slide.modes.map(({ icon: ModeIcon, label, sub }) => (
                  <div key={label} className="rounded-2xl border border-primary/30 bg-primary/10 p-4 flex flex-col items-center gap-2">
                    <ModeIcon className="w-6 h-6 text-primary" />
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Tips */}
            {slide.tips && (
              <div className="rounded-2xl bg-secondary/60 border border-border p-4 text-left w-full max-w-xs space-y-1.5">
                {slide.tips.map(tip => (
                  <p key={tip} className={`text-sm ${tip.startsWith('✓') ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {tip}
                  </p>
                ))}
                <p className="text-xs text-muted-foreground pt-1 border-t border-border/50 mt-1">
                  Photos are only used to generate your portrait.{' '}
                  <a href="/privacy" className="text-primary underline">Privacy Policy</a>
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 pb-6">
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
        <Button
          onClick={handleNext}
          className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base gap-2"
        >
          {step < SLIDES.length - 1 ? (
            <>Next <ChevronRight className="w-5 h-5" /></>
          ) : (
            <><Sparkles className="w-5 h-5" /> Try Your First Transformation Free</>
          )}
        </Button>
      </div>
    </div>
  );
}