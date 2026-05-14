/**
 * SharePanel — The single unified sharing component for ChronosBooth.
 * Used on: Result page, Gallery, Community posts, Video results.
 * Replaces: ShareSheet, ShareButton, SocialDeeplinks, ViralShareCard sharing logic.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Link2, Check, Loader2, Share2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { getShareCaption, getDownloadFilename, WATERMARK_TEXT } from '@/lib/appConfig';

// ─── Social button definitions ────────────────
const SOCIALS = [
  { id: 'native',    label: 'Share…',    emoji: '📤' },
  { id: 'tiktok',    label: 'TikTok',    emoji: '🎵' },
  { id: 'instagram', label: 'Instagram', emoji: '📸' },
  { id: 'facebook',  label: 'Facebook',  emoji: '👥' },
  { id: 'snapchat',  label: 'Snapchat',  emoji: '👻' },
  { id: 'messenger', label: 'Messenger', emoji: '💬' },
  { id: 'sms',       label: 'SMS',       emoji: '✉️' },
];

async function downloadImage(url, filename) {
  const res = await fetch(url);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

// Props:
//   transformation  — Transformation entity record (required)
//   showWatermark   — boolean, true for free users
//   trigger         — optional ReactNode; if omitted renders a Share button
export default function SharePanel({ transformation, showWatermark = false, trigger }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(null);
  const [copied, setLinkCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!transformation?.transformed_photo_url) return null;

  const imageUrl = transformation.transformed_photo_url;
  const eraLabel = transformation.era_label || 'Portrait';
  const filename  = getDownloadFilename(eraLabel);
  const caption   = getShareCaption(transformation);
  const publicLink = `${window.location.origin}/result/${transformation.id}`;
  const shareText  = `${caption}\n${publicLink}`;

  // ─── Action handlers ─────────────────────────

  const handleDownload = async () => {
    setLoading('download');
    try {
      await downloadImage(imageUrl, filename);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setLoading(null);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(publicLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleNative = async () => {
    setLoading('native');
    try {
      if (navigator.share) {
        if (navigator.canShare?.({ files: [] })) {
          try {
            const res = await fetch(imageUrl);
            const blob = await res.blob();
            const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({ files: [file], title: `My ${eraLabel} Portrait — ChronosBooth`, text: caption });
              setOpen(false);
              return;
            }
          } catch {}
        }
        await navigator.share({ title: `My ${eraLabel} Portrait — ChronosBooth`, text: caption, url: publicLink });
        setOpen(false);
      } else {
        await handleCopyLink();
      }
    } finally {
      setLoading(null);
    }
  };

  const handleInstagram = async () => {
    setLoading('instagram');
    try { await downloadImage(imageUrl, filename); } finally { setLoading(null); }
    setTimeout(() => { window.location.href = 'instagram://library'; }, 800);
  };

  const handleTikTok = async () => {
    setLoading('tiktok');
    try { await downloadImage(imageUrl, filename); } finally { setLoading(null); }
    setTimeout(() => { window.location.href = 'tiktok://'; }, 800);
  };

  const handleFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicLink)}&quote=${encodeURIComponent(caption)}`, '_blank', 'width=600,height=400');
  };

  const handleSnapchat = () => {
    window.open(`https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(publicLink)}`, '_blank');
  };

  const handleMessenger = () => {
    window.open(`fb-messenger://share?link=${encodeURIComponent(publicLink)}`, '_blank');
  };

  const handleSMS = () => {
    window.open(`sms:?body=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleAction = (id) => {
    if (id === 'native')    handleNative();
    else if (id === 'tiktok')    handleTikTok();
    else if (id === 'instagram') handleInstagram();
    else if (id === 'facebook')  handleFacebook();
    else if (id === 'snapchat')  handleSnapchat();
    else if (id === 'messenger') handleMessenger();
    else if (id === 'sms')       handleSMS();
  };

  return (
    <>
      {/* Trigger */}
      {trigger ? (
        <span onClick={() => setOpen(true)}>{trigger}</span>
      ) : (
        <Button
          variant="outline"
          className="flex-1 h-12 rounded-xl gap-2 border-border"
          onClick={() => setOpen(true)}
        >
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      )}

      {/* Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-8 max-h-[90vh] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="font-display text-center">Share Your Portrait</SheetTitle>
          </SheetHeader>

          {/* Preview */}
          <div className="flex justify-center mb-4">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-border">
              <img src={imageUrl} alt={eraLabel} className="w-full h-full object-cover" />
              {showWatermark && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 px-1">
                  <p className="text-[8px] text-yellow-300 font-bold text-center leading-tight">{WATERMARK_TEXT}</p>
                </div>
              )}
            </div>
          </div>

          {/* Caption preview */}
          <div className="mx-1 mb-4 rounded-xl bg-muted/50 border border-border px-3 py-2">
            <p className="text-[10px] text-muted-foreground mb-0.5 font-medium uppercase tracking-wider">Caption</p>
            <p className="text-sm text-foreground leading-snug">{caption}</p>
          </div>

          {/* Download + Copy Link */}
          <div className="grid grid-cols-2 gap-3 mb-4 px-1">
            <Button
              variant="outline"
              className="h-12 rounded-xl gap-2 border-border"
              onClick={handleDownload}
              disabled={!!loading}
            >
              {loading === 'download' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {saved ? 'Saved!' : 'Download'}
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-xl gap-2 border-border"
              onClick={handleCopyLink}
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
          </div>

          {/* Social grid */}
          <div className="grid grid-cols-4 gap-3 px-1">
            {SOCIALS.map(({ id, label, emoji }) => (
              <button
                key={id}
                onClick={() => handleAction(id)}
                disabled={!!loading}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-muted/60 transition-colors disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-xl">
                  {loading === id ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : emoji}
                </div>
                <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight">{label}</span>
              </button>
            ))}
          </div>

          {showWatermark && (
            <p className="text-center text-[10px] text-muted-foreground mt-4 px-4">
              {WATERMARK_TEXT} · Go Pro to remove ads &amp; watermarks.
            </p>
          )}

          <p className="text-center text-xs text-muted-foreground mt-2 px-4">
            Tip: Save the photo first, then upload it to your preferred app for best quality.
          </p>
        </SheetContent>
      </Sheet>
    </>
  );
}