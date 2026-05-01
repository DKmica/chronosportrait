import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Share2, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LimitBanner({ remaining, onShareForBonus }) {
  if (remaining > 1) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-5 mb-4 rounded-2xl border border-primary/30 bg-primary/10 p-4"
    >
      {remaining === 0 ? (
        <>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Daily limit reached</p>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Share a portrait to earn a bonus transformation, or come back tomorrow.
          </p>
          <Button
            size="sm"
            className="w-full h-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 text-xs font-semibold"
            onClick={onShareForBonus}
          >
            <Share2 className="w-3.5 h-3.5" />
            Share to Earn a Bonus
          </Button>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-primary" />
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">1 generation left today.</span> Share a portrait to earn bonus generations!
          </p>
        </div>
      )}
    </motion.div>
  );
}