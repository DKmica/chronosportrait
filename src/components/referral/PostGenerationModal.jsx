import React, { useState } from 'react';
import { Sparkles, Gift, Copy, Check, Share2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function PostGenerationModal({ open, onClose, transformation, referralCode, remaining }) {
  const [copied, setCopied] = useState(false);

  if (!transformation) return null;

  const referralLink = referralCode
    ? `${window.location.origin}?ref=${referralCode}`
    : window.location.origin;

  const caption = `Just discovered my past life with Chronos Booth 🕰️✨ Which era are YOU from? Try it free → ${referralLink}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `My ${transformation.era_label} portrait`,
        text: caption,
        url: referralLink,
      });
    } else {
      handleCopyLink();
    }
  };

  const isLow = typeof remaining === 'number' && remaining <= 1;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="p-0 overflow-hidden rounded-3xl border-border max-w-sm mx-auto">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Image hero */}
        <div className="relative aspect-square w-full overflow-hidden">
          <img
            src={transformation.transformed_photo_url}
            alt={transformation.era_label}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 mb-2">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-white text-xs font-semibold">{transformation.era_label}</span>
            </div>
            <p className="text-white font-display text-lg font-bold leading-tight">Your portrait is ready!</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 bg-card">
          {/* Earn credits nudge */}
          <div className="rounded-2xl bg-primary/10 border border-primary/25 px-4 py-3 flex items-start gap-3">
            <Gift className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Share &amp; earn free generations</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {referralCode
                  ? 'Each friend who joins with your link gives you +2 free generations.'
                  : 'Share your portrait to earn bonus generations.'}
                {isLow && <span className="text-primary font-medium"> You're almost out!</span>}
              </p>
            </div>
          </div>

          {/* Referral link */}
          {referralCode && (
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1.5">Your referral link</p>
              <div className="flex gap-2">
                <div className="flex-1 rounded-xl bg-secondary/60 border border-border px-3 py-2 text-xs text-muted-foreground truncate">
                  {referralLink}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-primary/15 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/25 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {/* CTA buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleShare}
              className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-2 text-sm font-semibold"
            >
              <Share2 className="w-4 h-4" />
              Share Portrait
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="h-11 px-4 rounded-xl border-border text-sm"
            >
              Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}