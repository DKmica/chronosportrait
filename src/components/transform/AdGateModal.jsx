import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Crown, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function AdGateModal({ open, onOpenChange, modeName, onUnlocked }) {
  const [phase, setPhase] = useState('prompt'); // prompt | watching | done
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (phase !== 'watching') return;
    setCountdown(5);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          setPhase('done');
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const handleWatchAd = () => {
    // Simulate ad watch — in production integrate a real ad SDK here
    setPhase('watching');
  };

  const handleClose = () => {
    setPhase('prompt');
    onOpenChange(false);
  };

  const handleUse = () => {
    onUnlocked();
    setPhase('prompt');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="mx-4 rounded-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-center">
            {phase === 'done' ? '🎉 Unlocked!' : `Unlock ${modeName} Mode`}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {phase === 'prompt' && (
            <motion.div key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground text-center">
                <span className="font-semibold text-foreground">{modeName} Mode</span> is a premium feature.<br />
                Watch a short ad to use it for free, or upgrade to Pro for unlimited access.
              </p>
              <Button
                onClick={handleWatchAd}
                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-semibold"
              >
                <Play className="w-4 h-4" />
                Watch Short Ad (free)
              </Button>
              <Button
                variant="outline"
                className="w-full h-10 rounded-xl border-border gap-2 text-sm"
                onClick={handleClose}
              >
                <Crown className="w-4 h-4 text-primary" />
                Upgrade to Pro instead
              </Button>
            </motion.div>
          )}

          {phase === 'watching' && (
            <motion.div key="watching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 py-6">
              <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center relative">
                {/* Simulated ad placeholder */}
                <span className="text-4xl">📺</span>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-xs font-bold">{countdown}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">Ad playing… please wait</p>
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 5, ease: 'linear' }}
                />
              </div>
            </motion.div>
          )}

          {phase === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                <span className="font-semibold text-foreground">{modeName} Mode</span> is now unlocked for this transformation!
              </p>
              <Button
                onClick={handleUse}
                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                Use {modeName} Mode
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}