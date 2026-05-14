import React from 'react';
import { Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CreditsDisplay({ profile }) {
  const navigate = useNavigate();
  const credits = profile?.credits || 0;
  if (!profile) return null;

  return (
    <button
      onClick={() => navigate('/pricing')}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary border border-border text-foreground text-xs font-semibold hover:border-primary/40 transition-colors"
    >
      <Zap className="w-3.5 h-3.5 text-primary" />
      {credits} credits
    </button>
  );
}