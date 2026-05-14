import React, { useState } from 'react';
import { Download, Link2, Check, Loader2, Share2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

function generateCaption(eraLabel) {
  const captions = [
    `Just traveled back to the ${eraLabel} era with Chronos Booth! 🕰️✨ Which era should I try next?`,
    `What if I lived in ${eraLabel}? AI made it happen 🤯 #ChronosBooth #AIArt`,
    `Me, but make it ${eraLabel}. 🏛️ Tried Chronos Booth and I'm obsessed! #TimeTravel #AITransformation`,
    `Turns out I look pretty good as a ${eraLabel} character 😂✨ #ChronosBooth`,
  ];
  return captions[Math.floor(Math.random() * captions.length)];
}

export default function ShareSheet({ open, onOpenChange, transformation }) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!transformation) return null;

  const imageUrl = transformation.transformed_photo_url;
  const eraLabel = transformation.era_label || 'this era';
  const caption = generateCaption(eraLabel);
  const publicLink = `${window.location.origin}/result/${transformation.id}`;
  const filename = `chronos-booth-${eraLabel.toLowerCase().replace(/\s+/g, '-')}.jpg`;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `My ${eraLabel} portrait`, text: caption, url: publicLink });
      } catch {}
    }
  };

  const handleTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}&url=${encodeURIComponent(publicLink)}`, '_blank');
  };

  const handleFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicLink)}&quote=${encodeURIComponent(caption)}`, '_blank');
  };

  const handleInstagram = async () => {
    // Download image, then deep-link to Instagram
    await handleDownload();
    setTimeout(() => { window.location.href = 'instagram://library'; }, 800);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-8">
        <SheetHeader className="mb-4">
          <SheetTitle className="font-display text-center">Share Your Portrait</SheetTitle>
        </SheetHeader>

        {/* Preview */}
        <div className="flex justify-center mb-5">
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-border">
            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Auto-generated caption */}
        <div className="mx-1 mb-5 rounded-xl bg-muted/50 border border-border px-4 py-3">
          <p className="text-xs text-muted-foreground mb-1 font-medium">Auto-generated caption</p>
          <p className="text-sm text-foreground leading-snug">{caption}</p>
        </div>

        {/* Action grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Button
            variant="outline"
            className="h-12 rounded-xl gap-2 border-border"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Save Photo
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

        {/* Social row */}
        <div className="flex gap-3 justify-center">
          {[
            { label: 'Twitter', emoji: '🐦', action: handleTwitter },
            { label: 'Facebook', emoji: '👥', action: handleFacebook },
            { label: 'Instagram', emoji: '📸', action: handleInstagram },
            ...(navigator.share ? [{ label: 'More', icon: Share2, action: handleNativeShare }] : []),
          ].map(({ label, emoji, icon: Icon, action }) => (
            <button
              key={label}
              onClick={action}
              className="flex flex-col items-center gap-1.5 px-4 py-2 rounded-2xl hover:bg-muted/60 transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-xl">
                {Icon ? <Icon className="w-5 h-5 text-foreground" /> : emoji}
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}