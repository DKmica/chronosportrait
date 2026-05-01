import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ArrowLeft, Sparkles, Download, Share2, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import PhotoUploader from '@/components/transform/PhotoUploader';
import { ERAS } from '@/lib/eras';
import { buildFaceSwapPrompt } from '@/lib/faceSwapPrompt';
import { STYLE_PROMPTS } from '@/components/transform/StyleSelector';

const PACKS = [
  {
    id: 'rulers',
    label: 'Rulers of History',
    emoji: '👑',
    description: '4 royal portraits across civilizations',
    eraIds: ['ancient_egypt', 'roman_empire', 'ancient_china', 'ancient_india'],
    color: 'from-amber-500/20 to-yellow-700/20',
    border: 'border-amber-500/30',
  },
  {
    id: 'warriors',
    label: 'Warriors Through Time',
    emoji: '⚔️',
    description: '4 fierce warrior transformations',
    eraIds: ['viking', 'medieval', 'feudal_japan', 'aztec'],
    color: 'from-slate-500/20 to-stone-700/20',
    border: 'border-slate-500/30',
  },
  {
    id: 'future',
    label: 'Future Visions',
    emoji: '🚀',
    description: '4 sci-fi and futuristic looks',
    eraIds: ['cyberpunk', 'space', 'steampunk', 'post_apocalyptic'],
    color: 'from-cyan-500/20 to-indigo-700/20',
    border: 'border-cyan-500/30',
  },
  {
    id: 'glamour',
    label: 'Golden Age Glamour',
    emoji: '✨',
    description: '4 retro-glam era portraits',
    eraIds: ['roaring_20s', 'prohibition', 'swinging_60s', 'disco'],
    color: 'from-rose-500/20 to-pink-700/20',
    border: 'border-rose-500/30',
  },
];

export default function EraPack() {
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [selectedPack, setSelectedPack] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);

  const handlePhotoSelect = (file) => {
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!photo || !selectedPack) return;
    setGenerating(true);
    setResults([]);
    setProgress(0);

    const pack = PACKS.find((p) => p.id === selectedPack);
    const eraList = pack.eraIds.map((id) => ERAS.find((e) => e.id === id)).filter(Boolean);

    const { file_url } = await base44.integrations.Core.UploadFile({ file: photo });
    const generated = [];

    for (let i = 0; i < eraList.length; i++) {
      const era = eraList[i];
      const prompt = buildFaceSwapPrompt(era.prompt, STYLE_PROMPTS.balanced);

      const result = await base44.integrations.Core.GenerateImage({
        prompt,
        existing_image_urls: [file_url],
      });

      const transformation = await base44.entities.Transformation.create({
        original_photo_url: file_url,
        era: era.id,
        era_label: era.label,
        transformed_photo_url: result.url,
        status: 'completed',
      });

      generated.push({ ...transformation, transformed_photo_url: result.url, era_label: era.label, era_emoji: era.emoji || '🖼️' });
      setProgress(Math.round(((i + 1) / eraList.length) * 100));
      setResults([...generated]);
    }

    setGenerating(false);
  };

  const pack = PACKS.find((p) => p.id === selectedPack);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 -ml-2">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">Era Pack</h1>
          <p className="text-muted-foreground text-xs">Generate your full era pack</p>
        </div>
      </div>

      <div className="px-5 space-y-6 pb-10">
        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/15 to-accent/10 border border-primary/20 p-5 text-center">
          <div className="text-4xl mb-2">📦</div>
          <p className="font-display text-xl font-bold text-foreground mb-1">Generate Your Era Pack</p>
          <p className="text-muted-foreground text-sm">4 AI portraits in one themed collection — perfect for sharing.</p>
        </div>

        {/* Photo upload */}
        {!generating && results.length === 0 && (
          <>
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Your Photo</p>
              <PhotoUploader
                photoPreview={photoPreview}
                onPhotoSelect={handlePhotoSelect}
                onClear={() => { setPhoto(null); setPhotoPreview(null); }}
              />
            </div>

            {/* Pack selection */}
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Choose a Pack</p>
              <div className="space-y-3">
                {PACKS.map((p) => {
                  const packEras = p.eraIds.map((id) => ERAS.find((e) => e.id === id)).filter(Boolean);
                  return (
                    <motion.button
                      key={p.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedPack(p.id)}
                      className={`w-full text-left rounded-2xl border p-4 transition-all ${
                        selectedPack === p.id
                          ? `bg-gradient-to-br ${p.color} ${p.border} ring-2 ring-primary/40`
                          : 'bg-card border-border hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl leading-none">{p.emoji}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-foreground">{p.label}</p>
                            {selectedPack === p.id && (
                              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                <Check className="w-3 h-3 text-primary-foreground" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 mb-2">{p.description}</p>
                          <div className="flex gap-1 flex-wrap">
                            {packEras.map((e) => (
                              <span key={e.id} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">
                                {e.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!photo || !selectedPack}
              className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base gap-2 disabled:opacity-30"
            >
              <Package className="w-5 h-5" />
              Generate {pack ? `"${pack.label}"` : 'Era Pack'}
            </Button>
          </>
        )}

        {/* Generating progress */}
        {generating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-5"
          >
            <div className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center gap-4">
              <div className="relative w-16 h-16">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border-2 border-primary/30"
                  style={{ borderTopColor: 'hsl(var(--primary))' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">Generating your era pack…</p>
                <p className="text-sm text-muted-foreground mt-1">{progress}% complete · {results.length}/{pack?.eraIds.length || 4} portraits</p>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Live results */}
            {results.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {results.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative rounded-xl overflow-hidden aspect-square"
                  >
                    <img src={r.transformed_photo_url} alt={r.era_label} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="text-white text-xs font-semibold">{r.era_label}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Results grid */}
        {!generating && results.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-display text-lg font-bold text-foreground">Your Era Pack</p>
              <span className="text-xs px-3 py-1 rounded-full bg-primary/15 text-primary font-semibold">
                {results.length} portraits
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {results.map((r) => (
                <motion.div
                  key={r.id}
                  whileTap={{ scale: 0.97 }}
                  className="relative rounded-2xl overflow-hidden aspect-square cursor-pointer"
                  onClick={() => navigate(`/result/${r.id}`)}
                >
                  <img src={r.transformed_photo_url} alt={r.era_label} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 p-3">
                    <p className="text-white font-display text-sm font-bold">{r.era_label}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl border-border gap-2"
                onClick={() => { setResults([]); setProgress(0); }}
              >
                New Pack
              </Button>
              <Button
                className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: 'My Era Pack', text: 'Check out my Era Pack from Chronos Booth! 🕰️✨', url: window.location.origin });
                  }
                }}
              >
                <Share2 className="w-4 h-4" />
                Share Pack
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}