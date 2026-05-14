import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Copy, Share2, RefreshCw, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const TIKTOK_CAPTIONS = [
  'Apparently I belong in the {era} age. AI never lies 👀 #ChronosBooth #TimeTravel',
  'I asked AI which era I belong to and it said {era}… okay then 😭✨ #ChronosBooth',
  'POV: AI sends you back to {era} #EraCheck #ChronosBooth',
  'Which era do I look like I came from? AI said {era} 🔥 #ChronosBooth',
];
const IG_CAPTIONS = [
  'Living my best {era} life ✨ Generated with @ChronosBooth',
  'What if I was born in {era}? AI made it real 🕰️ #ChronosBooth',
  'Me but make it {era} 🎨 #AIArt #ChronosBooth',
];
const FB_CAPTIONS = [
  'AI just revealed I belong in the {era} era! Check out Chronos Booth to find your own era 🕰️✨',
  'What would you look like in {era}? This AI app is unreal. Try it → ChronosBooth',
];

function pickCaption(templates, eraLabel) {
  const t = templates[Math.floor(Math.random() * templates.length)];
  return t.replace('{era}', eraLabel);
}

export default function ViralShareCard({ transformation }) {
  const [platform, setPlatform] = useState('instagram');
  const [caption, setCaption] = useState(() =>
    pickCaption(IG_CAPTIONS, transformation?.era_label || 'this era')
  );
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [aiCaption, setAiCaption] = useState(false);
  const [generatingCaption, setGeneratingCaption] = useState(false);

  if (!transformation?.transformed_photo_url) return null;

  const eraLabel = transformation.era_label || 'this era';

  const handlePlatformChange = (p) => {
    setPlatform(p);
    const templates = p === 'tiktok' ? TIKTOK_CAPTIONS : p === 'facebook' ? FB_CAPTIONS : IG_CAPTIONS;
    setCaption(pickCaption(templates, eraLabel));
    setAiCaption(false);
  };

  const handleGenerateAICaption = async () => {
    setGeneratingCaption(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a viral social media caption for ${platform} for a photo transformed to look like it's from the "${eraLabel}" era. 
Make it short (max 2 sentences), fun, relatable, and shareable. 
Include 2-3 relevant hashtags at the end. 
Use casual internet language. Examples: "Apparently I belong in ${eraLabel}.", "AI sent me back in time to ${eraLabel}."
Return ONLY the caption text, no extra explanation.`,
      });
      setCaption(response);
      setAiCaption(true);
    } catch {
      setCaption(pickCaption(platform === 'tiktok' ? TIKTOK_CAPTIONS : platform === 'facebook' ? FB_CAPTIONS : IG_CAPTIONS, eraLabel));
    }
    setGeneratingCaption(false);
  };

  const handleCopyCaption = async () => {
    await navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(transformation.transformed_photo_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chronos-booth-${eraLabel.toLowerCase().replace(/\s+/g, '-')}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const handleNativeShare = async () => {
    const shareUrl = `${window.location.origin}/result/${transformation.id}`;
    if (navigator.share) {
      await navigator.share({ title: `My ${eraLabel} Portrait`, text: caption, url: shareUrl });
    } else {
      await navigator.clipboard.writeText(`${caption}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const PLATFORMS = [
    { id: 'instagram', label: '📸 IG', full: 'Instagram' },
    { id: 'tiktok', label: '🎵 TikTok', full: 'TikTok' },
    { id: 'facebook', label: '👥 FB', full: 'Facebook' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card rounded-3xl border border-border overflow-hidden"
    >
      {/* Image with watermark */}
      <div className="relative aspect-square">
        <img
          src={transformation.transformed_photo_url}
          alt={eraLabel}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        {/* Watermark */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div>
            <p className="text-white font-display text-lg font-bold leading-tight">{eraLabel}</p>
            <p className="text-white/60 text-xs">AI-Generated Portrait</p>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm">
            <span className="text-primary text-xs font-bold">⏰ Time Frame Shift</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Platform selector */}
        <div className="flex gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePlatformChange(p.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all border ${
                platform === p.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-secondary border-border text-muted-foreground hover:border-primary/40'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Caption editor */}
        <div className="rounded-xl bg-muted/40 border border-border p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground">
              {aiCaption ? '✨ AI Caption' : 'Caption'}
            </p>
            <button
              onClick={handleGenerateAICaption}
              disabled={generatingCaption}
              className="flex items-center gap-1 text-xs text-primary font-semibold hover:opacity-80 transition-opacity"
            >
              {generatingCaption ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              AI Rewrite
            </button>
          </div>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground resize-none focus:outline-none"
            rows={3}
          />
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="h-11 rounded-xl gap-1.5 border-border text-sm"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Save
          </Button>
          <Button
            variant="outline"
            className="h-11 rounded-xl gap-1.5 border-border text-sm"
            onClick={handleCopyCaption}
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Caption'}
          </Button>
        </div>

        <Button
          onClick={handleNativeShare}
          className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-2 text-sm"
        >
          <Share2 className="w-4 h-4" />
          Share to {PLATFORMS.find(p => p.id === platform)?.full}
        </Button>
      </div>
    </motion.div>
  );
}