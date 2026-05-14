import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Sparkles, Share2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function VideoGenerator({ transformation, onVideoReady }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [cinemaReady, setCinemaReady] = useState(
    transformation.video_status === 'completed' && !!transformation.video_url
  );
  const [eraAtmosphere, setEraAtmosphere] = useState(transformation.video_url || null);

  const handleGenerate = async () => {
    setIsGenerating(true);

    await base44.entities.Transformation.update(transformation.id, {
      video_status: 'processing',
    });

    // Generate an atmospheric companion frame via AI to use as a background layer
    const atmospherePrompt = await base44.integrations.Core.InvokeLLM({
      prompt: `Write a short image generation prompt (max 60 words) for a moody atmospheric background scene that complements a portrait from: ${transformation.era_label}.
Focus on environmental elements only — no people. Era-appropriate setting: dramatic lighting, depth, cinematic film grain.
Output only the prompt text.`,
    });

    const result = await base44.integrations.Core.GenerateImage({
      prompt: `${atmospherePrompt} Wide cinematic shot, dramatic, film grain, no people, environmental scene.`,
    });

    await base44.entities.Transformation.update(transformation.id, {
      video_url: result.url,
      video_status: 'completed',
    });

    setEraAtmosphere(result.url);
    setCinemaReady(true);
    onVideoReady({ ...transformation, video_url: result.url, video_status: 'completed' });
    setIsGenerating(false);
  };

  const handleShare = () => {
    const url = transformation.transformed_photo_url;
    if (navigator.share) {
      navigator.share({
        title: `My ${transformation.era_label} cinematic portrait`,
        text: 'Check out my cinematic AI time-travel portrait from Chronos Booth!',
        url: window.location.href,
      });
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Film className="w-4 h-4 text-primary" />
        <h3 className="font-display text-sm font-semibold text-foreground">Cinematic Video</h3>
        {cinemaReady && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">Ready</span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {cinemaReady ? (
          <motion.div key="ready" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            {/* Cinematic pan player */}
            <div
              className="relative rounded-2xl overflow-hidden aspect-[9/16] sm:aspect-square bg-black cursor-pointer select-none"
              onClick={() => setIsPlaying((p) => !p)}
            >
              {/* Atmospheric background */}
              {eraAtmosphere && (
                <img
                  src={eraAtmosphere}
                  alt="atmosphere"
                  className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm scale-110"
                />
              )}

              {/* Portrait with Ken Burns pan */}
              <div className="absolute inset-0 overflow-hidden">
                <img
                  src={transformation.transformed_photo_url}
                  alt="Cinematic portrait"
                  className={`w-full h-full object-cover origin-center transition-none ${
                    isPlaying ? 'animate-ken-burns' : ''
                  }`}
                  style={{ willChange: 'transform' }}
                />
              </div>

              {/* Cinematic letterbox bars */}
              <div className="absolute top-0 left-0 right-0 h-8 bg-black pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-black pointer-events-none" />

              {/* Vignette overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
                }}
              />

              {/* Play / pause indicator */}
              <AnimatePresence>
                {!isPlaying && (
                  <motion.div
                    key="play-btn"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20">
                      <Play className="w-7 h-7 text-white fill-white ml-1" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Era label */}
              <div className="absolute bottom-10 left-0 right-0 flex justify-center pointer-events-none">
                <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1 text-white/80 text-[10px] font-medium tracking-wider uppercase">
                  {transformation.era_label} · 5s Cinematic Pan
                </div>
              </div>

              {/* Playing indicator */}
              {isPlaying && (
                <div className="absolute top-10 right-3">
                  <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-2 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-white/70 text-[9px] font-medium">LIVE</span>
                  </div>
                </div>
              )}
            </div>

            <p className="text-center text-xs text-muted-foreground">Tap to play / pause the cinematic pan</p>

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
              <p className="text-xs text-muted-foreground mt-0.5">Crafting era atmosphere & motion</p>
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
                <p className="text-xs text-muted-foreground">5-second cinematic pan with era atmosphere</p>
              </div>
              <Film className="w-4 h-4 text-muted-foreground ml-auto" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}