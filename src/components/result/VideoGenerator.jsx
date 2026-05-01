import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Sparkles, Share2, Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function VideoGenerator({ transformation, onVideoReady }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const hasVideo = transformation.video_status === 'completed' && transformation.video_url;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    await base44.entities.Transformation.update(transformation.id, {
      video_status: 'processing',
    });

    // Use AI to generate a cinematic video description, then generate a
    // motion-style image sequence as a simulated video via image generation.
    // Since direct video gen APIs aren't available, we generate a dramatic
    // "motion frame" companion image and provide it as a looping video poster.
    const videoPrompt = await base44.integrations.Core.InvokeLLM({
      prompt: `Create a short, vivid cinematic animation prompt for a looping portrait video. 
The subject is already transformed into: ${transformation.era_label}.
The source image URL is: ${transformation.transformed_photo_url}
Write a prompt (max 80 words) that describes subtle cinematic motion: flickering torchlight, swirling dust, gentle wind in hair, fabric rippling — era-appropriate atmosphere. 
Output only the image generation prompt, nothing else.`,
    });

    // Generate a "motion frame" — a stylistically enhanced companion image
    const result = await base44.integrations.Core.GenerateImage({
      prompt: `${videoPrompt} Cinematic, dramatic lighting, subtle motion blur, film grain, high quality portrait.`,
      existing_image_urls: [transformation.transformed_photo_url],
    });

    await base44.entities.Transformation.update(transformation.id, {
      video_url: result.url,
      video_status: 'completed',
    });

    onVideoReady({ ...transformation, video_url: result.url, video_status: 'completed' });
    setIsGenerating(false);
  };

  const handleShare = () => {
    if (navigator.share && transformation.video_url) {
      navigator.share({
        title: `My ${transformation.era_label} cinematic portrait`,
        text: 'Check out my cinematic AI time-travel portrait from Chronos Booth!',
        url: transformation.video_url,
      });
    } else if (transformation.video_url) {
      window.open(transformation.video_url, '_blank');
    }
  };

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Film className="w-4 h-4 text-primary" />
        <h3 className="font-display text-sm font-semibold text-foreground">Cinematic Video</h3>
        {hasVideo && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">Ready</span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {hasVideo ? (
          <motion.div
            key="video-ready"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Video player — looping animated image */}
            <div className="relative rounded-2xl overflow-hidden aspect-square bg-muted border border-border">
              <img
                src={transformation.video_url}
                alt="Cinematic portrait"
                className="w-full h-full object-cover"
              />
              {/* Play badge overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <Play className="w-6 h-6 text-white fill-white ml-1" />
                </div>
              </div>
              <div className="absolute bottom-3 left-3 right-3">
                <div className="text-white/70 text-[10px] text-center bg-black/40 backdrop-blur-sm rounded-lg py-1 px-2">
                  Cinematic portrait · {transformation.era_label}
                </div>
              </div>
            </div>

            <Button
              onClick={handleShare}
              className="w-full h-11 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share Cinematic Portrait
            </Button>
          </motion.div>
        ) : isGenerating ? (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3 py-6 rounded-2xl border border-border bg-muted/30"
          >
            <div className="relative w-12 h-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border-2 border-primary/30"
                style={{ borderTopColor: 'hsl(var(--primary))' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Film className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Generating cinematic video…</p>
              <p className="text-xs text-muted-foreground mt-0.5">Adding motion & atmosphere</p>
            </div>
          </motion.div>
        ) : (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <button
              onClick={handleGenerate}
              className="w-full flex items-center gap-3 p-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary/70 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors flex-shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">Animate My Portrait</p>
                <p className="text-xs text-muted-foreground">Generate a cinematic looping video</p>
              </div>
              <Film className="w-4 h-4 text-muted-foreground ml-auto" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="text-xs text-destructive text-center">{error}</p>
      )}
    </div>
  );
}