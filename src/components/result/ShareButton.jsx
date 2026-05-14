import React, { useState } from 'react';
import { Share2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

const SOCIAL_APPS = [
  {
    id: 'native',
    label: 'Share…',
    emoji: '📤',
    description: 'Open system share sheet',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    emoji: '📸',
    description: 'Save & open Instagram',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    emoji: '🎵',
    description: 'Save & open TikTok',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    emoji: '👥',
    description: 'Share to Facebook',
  },
  {
    id: 'download',
    label: 'Save Photo',
    emoji: '💾',
    description: 'Download to camera roll',
  },
];

async function fetchImageAsFile(url, filename) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || 'image/jpeg' });
}

export default function ShareButton({ transformation }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(null);
  const [saved, setSaved] = useState(false);

  const imageUrl = transformation.transformed_photo_url;
  const title = `My ${transformation.era_label} portrait — Chronos Booth`;
  const filename = `chronos-booth-${transformation.era_label?.toLowerCase().replace(/\s+/g, '-')}.jpg`;

  const handleDownload = async () => {
    setLoading('download');
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setLoading(null);
    }
  };

  const handleNativeShare = async () => {
    setLoading('native');
    try {
      if (navigator.share) {
        if (navigator.canShare && navigator.canShare({ files: [] })) {
          // Try sharing as file (works on iOS Safari, Android Chrome)
          const file = await fetchImageAsFile(imageUrl, filename);
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title });
            setOpen(false);
            setLoading(null);
            return;
          }
        }
        // Fallback: share URL
        await navigator.share({ title, url: imageUrl });
        setOpen(false);
      }
    } finally {
      setLoading(null);
    }
  };

  const handleInstagram = async () => {
    setLoading('instagram');
    // Save image first, then deep-link to Instagram
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(null);
    }
    setTimeout(() => {
      window.location.href = 'instagram://library';
    }, 800);
  };

  const handleTikTok = async () => {
    setLoading('tiktok');
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(null);
    }
    setTimeout(() => {
      window.location.href = 'tiktok://';
    }, 800);
  };

  const handleFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(imageUrl)}&quote=${encodeURIComponent(title)}`;
    window.open(fbUrl, '_blank');
  };

  const handleAction = (id) => {
    if (id === 'native') handleNativeShare();
    else if (id === 'instagram') handleInstagram();
    else if (id === 'tiktok') handleTikTok();
    else if (id === 'facebook') handleFacebook();
    else if (id === 'download') handleDownload();
  };

  return (
    <>
      <Button
        variant="outline"
        className="flex-1 h-12 rounded-xl gap-2 border-border"
        onClick={() => setOpen(true)}
      >
        <Share2 className="w-4 h-4" />
        Share
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-8">
          <SheetHeader className="mb-4">
            <SheetTitle className="font-display text-center">Share Your Portrait</SheetTitle>
          </SheetHeader>

          {/* Preview strip */}
          <div className="flex justify-center mb-5">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-border">
              <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3 px-2">
            {SOCIAL_APPS.map(({ id, label, emoji }) => (
              <button
                key={id}
                onClick={() => handleAction(id)}
                disabled={!!loading}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-muted/60 transition-colors disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-xl">
                  {loading === id ? (
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  ) : (
                    emoji
                  )}
                </div>
                <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight">
                  {id === 'download' && saved ? '✓ Saved!' : label}
                </span>
              </button>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4 px-4">
            Tip: Save the photo first, then upload it to your preferred app for the best quality.
          </p>
        </SheetContent>
      </Sheet>
    </>
  );
}