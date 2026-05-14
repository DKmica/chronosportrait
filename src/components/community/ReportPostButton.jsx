/**
 * ReportPostButton — Google Play content moderation requirement.
 * Allows users to flag inappropriate community posts.
 */
import React, { useState } from 'react';
import { Flag, Loader2, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const REASONS = [
  'Inappropriate content',
  'Nudity or sexual content',
  'Harassment or hate speech',
  'Spam or misleading',
  'Violence or graphic content',
  'Other',
];

export default function ReportPostButton({ postId, onReported }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selected) return;
    setLoading(true);
    // In production: send report to backend / moderation queue
    // For now: log and show confirmation
    console.log(`[Report] Post ${postId} reported for: ${selected}`);
    await new Promise(r => setTimeout(r, 800)); // simulate network
    setSubmitted(true);
    setLoading(false);
    if (onReported) onReported(postId);
    setTimeout(() => {
      setOpen(false);
      setSubmitted(false);
      setSelected(null);
    }, 1500);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-destructive/70 transition-colors"
      >
        <Flag className="w-3.5 h-3.5" />
        Report
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle>Report this post</DialogTitle>
            <DialogDescription>
              Help keep ChronosBooth safe. Select a reason and we'll review it.
            </DialogDescription>
          </DialogHeader>

          {submitted ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
              <p className="text-sm font-semibold text-foreground">Thanks for letting us know!</p>
              <p className="text-xs text-muted-foreground">We'll review this post shortly.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                {REASONS.map(r => (
                  <button
                    key={r}
                    onClick={() => setSelected(r)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all border ${
                      selected === r
                        ? 'bg-destructive/10 border-destructive/40 text-destructive font-semibold'
                        : 'border-border text-muted-foreground hover:bg-muted/30'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 rounded-xl">Cancel</Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!selected || loading}
                  className="flex-1 rounded-xl bg-destructive hover:bg-destructive/90 text-white disabled:opacity-40"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Report'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}