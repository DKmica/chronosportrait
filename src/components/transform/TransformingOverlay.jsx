import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function TransformingOverlay({ eraLabel }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8"
    >
      {/* Animated rings */}
      <div className="relative w-32 h-32">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-primary/30"
          style={{ borderTopColor: 'hsl(var(--primary))' }}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-3 rounded-full border-2 border-accent/30"
          style={{ borderTopColor: 'hsl(var(--accent))' }}
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-6 rounded-full border-2 border-primary/20"
          style={{ borderTopColor: 'hsl(var(--primary))' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Sparkles className="w-8 h-8 text-primary" />
          </motion.div>
        </div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl text-foreground">
          Transforming...
        </h2>
        <p className="text-muted-foreground text-sm">
          Traveling to the <span className="text-primary">{eraLabel}</span>
        </p>
      </div>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/60"
          initial={{
            x: Math.random() * 300 - 150,
            y: Math.random() * 300 - 150,
            opacity: 0,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </motion.div>
  );
}