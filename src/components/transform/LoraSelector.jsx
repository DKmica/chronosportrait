import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Brain, ChevronDown, CheckCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function LoraSelector({ selectedLoraId, onSelect }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const { data: loras = [] } = useQuery({
    queryKey: ['styleLoras'],
    queryFn: () => base44.entities.StyleLora.list('-created_date', 20),
    enabled: !!user,
  });

  const readyLoras = loras.filter(l => l.status === 'ready');
  const selected = readyLoras.find(l => l.id === selectedLoraId);

  if (readyLoras.length === 0) {
    return (
      <button
        onClick={() => navigate('/style-lora')}
        className="flex items-center gap-2 py-2.5 px-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 w-full"
      >
        <Brain className="w-4 h-4 text-primary/60" />
        <span className="text-xs text-muted-foreground flex-1 text-left">
          Train a personal AI model for better likeness
        </span>
        <span className="text-xs text-primary font-semibold">Set up →</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 py-2.5 px-4 rounded-xl border border-border bg-secondary/50 w-full"
      >
        <Brain className={`w-4 h-4 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
        <span className="text-xs flex-1 text-left">
          {selected ? (
            <span className="font-semibold text-foreground">{selected.name}</span>
          ) : (
            <span className="text-muted-foreground">Use personal AI model (optional)</span>
          )}
        </span>
        {selected ? (
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(null); }}
            className="p-0.5"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        ) : (
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl overflow-hidden z-20 shadow-xl"
          >
            <div className="p-1">
              <button
                onClick={() => { onSelect(null); setOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-secondary/50 text-left"
              >
                <div className="w-4 h-4" />
                <span className="text-xs text-muted-foreground">No personal model</span>
              </button>
              {readyLoras.map(lora => (
                <button
                  key={lora.id}
                  onClick={() => { onSelect(lora.id); setOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-secondary/50 text-left"
                >
                  {selectedLoraId === lora.id ? (
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                  ) : (
                    <Brain className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{lora.name}</p>
                    {lora.style_summary && (
                      <p className="text-[10px] text-muted-foreground truncate">{lora.style_summary}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div className="border-t border-border px-3 py-2">
              <button
                onClick={() => { navigate('/style-lora'); setOpen(false); }}
                className="text-xs text-primary font-semibold"
              >
                + Train new model
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}