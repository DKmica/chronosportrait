import React from "react";
import { motion } from "framer-motion";

export default function EraCard({ era, isSelected, onSelect, disabled }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => onSelect(era)}
      disabled={disabled}
      className={`relative overflow-hidden rounded-xl p-3 text-left transition-all duration-300 ${
        isSelected
          ? "ring-2 ring-primary bg-primary/15 shadow-lg shadow-primary/20"
          : "bg-secondary/60 hover:bg-secondary/90 border border-border/50"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${era.gradient} opacity-60`} />
      <div className="relative z-10">
        <span className="text-2xl">{era.emoji}</span>
        <p className="font-heading font-semibold text-sm mt-1.5 text-foreground leading-tight">
          {era.name}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
          {era.description}
        </p>
      </div>
    </motion.button>
  );
}