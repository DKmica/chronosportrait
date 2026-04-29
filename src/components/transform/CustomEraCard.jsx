import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, X } from 'lucide-react';

export default function CustomEraCard({ isSelected, onClick, onDescriptionChange, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden rounded-xl aspect-[3/4] flex flex-col ${
        isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
      }`}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/40 via-secondary to-muted" />

      {/* Card content */}
      <button
        onClick={onClick}
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 z-10"
      >
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Wand2 className="w-5 h-5 text-primary" />
        </div>
        <p className="text-white font-display text-sm font-semibold text-center leading-tight">
          Custom Era
        </p>
        <p className="text-white/60 text-[10px] text-center">Your idea</p>
      </button>

      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center z-20"
        >
          <svg className="w-3.5 h-3.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      )}
    </motion.div>
  );
}