import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowLeft, Zap, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import PhotoUploader from '@/components/transform/PhotoUploader';
import { buildFaceSwapPrompt } from '@/lib/faceSwapPrompt';

const ERA_RESULTS = [
  {
    id: 'wild_west',
    era: 'Wild West Gunslinger',
    period: '1850s',
    emoji: '🤠',
    personality: 'Bold, restless, and impossible to tame. You live by your own rules and never back down from a challenge.',
    shareText: 'Chronos Booth says I belong in the Wild West 🤠 "Bold, restless, and impossible to tame." Find your era →',
    color: 'from-amber-600 to-orange-800',
    accent: '#f59e0b',
  },
  {
    id: 'viking',
    era: 'Viking Warrior',
    period: '793 AD',
    emoji: '⚔️',
    personality: 'Fierce, loyal, and hungry for glory. You forge your own path and inspire others to follow.',
    shareText: 'I\'m a Viking Warrior according to Chronos Booth ⚔️ "Fierce, loyal, and hungry for glory." What\'s your era? →',
    color: 'from-slate-600 to-slate-900',
    accent: '#94a3b8',
  },
  {
    id: 'ancient_egypt',
    era: 'Ancient Egyptian Royal',
    period: '3000 BC',
    emoji: '𓂀',
    personality: 'Regal, mysterious, and commanding. You carry the weight of eternity with effortless grace.',
    shareText: 'I\'m Ancient Egyptian Royalty according to Chronos Booth 𓂀 "Regal, mysterious, and commanding." →',
    color: 'from-yellow-600 to-amber-900',
    accent: '#d97706',
  },
  {
    id: 'renaissance',
    era: 'Renaissance Noble',
    period: '1500s',
    emoji: '🎨',
    personality: 'Artistic, curious, and ahead of your time. You see beauty where others see chaos.',
    shareText: 'Chronos Booth says I\'m a Renaissance Noble 🎨 "Artistic, curious, and ahead of your time." →',
    color: 'from-red-700 to-rose-900',
    accent: '#dc2626',
  },
  {
    id: 'cyberpunk',
    era: 'Cyberpunk Rebel',
    period: '2077',
    emoji: '⚡',
    personality: 'Defiant, electric, and unstoppable. You see the future others are afraid to imagine.',
    shareText: 'Chronos Booth revealed I\'m a Cyberpunk Rebel ⚡ "Defiant, electric, and unstoppable." Find yours →',
    color: 'from-violet-600 to-indigo-900',
    accent: '#7c3aed',
  },
  {
    id: 'roaring_20s',
    era: '1920s Film Star',
    period: '1920s',
    emoji: '🎬',
    personality: 'Glamorous, magnetic, and full of life. Every room you enter becomes your stage.',
    shareText: 'I\'m a 1920s Film Star according to Chronos Booth 🎬 "Every room I enter becomes my stage." →',
    color: 'from-amber-500 to-yellow-800',
    accent: '#f59e0b',
  },
  {
    id: 'space',
    era: 'Future Space Commander',
    period: '2150',
    emoji: '🚀',
    personality: 'Visionary, fearless, and boundless. The universe itself isn\'t big enough for your ambitions.',
    shareText: 'Chronos Booth says I\'m a Future Space Commander 🚀 "The universe isn\'t big enough for my ambitions." →',
    color: 'from-blue-700 to-cyan-900',
    accent: '#0891b2',
  },
  {
    id: 'medieval',
    era: 'Medieval Knight',
    period: '1200s',
    emoji: '🛡️',
    personality: 'Honorable, steadfast, and driven by purpose. You would die for what you believe in.',
    shareText: 'I\'m a Medieval Knight according to Chronos Booth 🛡️ "Honorable, steadfast, driven by purpose." →',
    color: 'from-stone-600 to-stone-900',
    accent: '#78716c',
  },
];

function pickEra() {
  return ERA_RESULTS[Math.floor(Math.random() * ERA_RESULTS.length)];
}

export default function FindTimeline() {
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);

  const handlePhotoSelect = (file) => {
    setPhoto(file);
    setUploadedUrl(null);
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!photo) return;
    setAnalyzing(true);
    setResult(null);

    // AI-powered era analysis
    const { file_url } = await base44.integrations.Core.UploadFile({ file: photo });
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an AI that analyzes a person's face and determines which historical era they belong to based on their appearance, energy, and features.

Look at this person and pick ONE of these eras for them: wild_west, viking, ancient_egypt, renaissance, cyberpunk, roaring_20s, space, medieval.

Return ONLY a JSON object with:
- era_id: one of the era IDs above
- confidence: a number 0-100
- reason: a one-sentence poetic reason why they belong in that era (e.g. "Your sharp, piercing gaze speaks of ancient authority")

Be dramatic and poetic. Make the user feel the result is uniquely personal.`,
      file_urls: [file_url],
      response_json_schema: {
        type: 'object',
        properties: {
          era_id: { type: 'string' },
          confidence: { type: 'number' },
          reason: { type: 'string' },
        },
      },
    });

    const matched = ERA_RESULTS.find((e) => e.id === response.era_id) || pickEra();
    setResult({ ...matched, aiReason: response.reason, confidence: response.confidence });
    // Cache the uploaded URL so we don't re-upload during generation
    setUploadedUrl(file_url);
    setAnalyzing(false);
  };

  const handleShare = async () => {
    const text = result.shareText + ' chronosbooth.app';
    if (navigator.share) {
      navigator.share({ title: `I\'m a ${result.era}`, text });
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTransformNow = async () => {
    if (!result) return;
    setGenerating(true);
    setGenerateError(null);
    try {
      // Use the already-uploaded URL from analysis, or upload now if missing
      let photoUrl = uploadedUrl;
      if (!photoUrl && photo) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: photo });
        photoUrl = file_url;
        setUploadedUrl(file_url);
      }
      if (!photoUrl) throw new Error('No photo available. Please re-upload.');

      // Build prompt using the matched era label
      const eraPrompt = result.era;
      const prompt = buildFaceSwapPrompt(eraPrompt, result.era);

      // Create DB record
      const transformation = await base44.entities.Transformation.create({
        original_photo_url: photoUrl,
        era: result.id,
        era_label: result.era,
        status: 'processing',
      });

      // Call AI generation
      const response = await base44.functions.invoke('transformPhoto', {
        prompt,
        original_photo_url: photoUrl,
        extra_photo_urls: [],
        transformation_id: transformation.id,
      });

      if (response.data?.error) {
        await base44.entities.Transformation.update(transformation.id, { status: 'failed' });
        throw new Error(response.data.error);
      }

      await base44.entities.Transformation.update(transformation.id, {
        transformed_photo_url: response.data.url,
        status: 'completed',
      });

      navigate(`/result/${transformation.id}`);
    } catch (err) {
      setGenerateError(err.message || 'Generation failed. Please try again.');
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 -ml-2">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="font-display text-xl font-bold text-foreground">Find Your Timeline</h1>
          <p className="text-muted-foreground text-sm">AI reveals your true era</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-5 space-y-6"
          >
            {/* Hero copy */}
            <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 p-5 text-center">
              <p className="font-display text-2xl font-bold text-foreground mb-2">
                Unlock your past life portrait.
              </p>
              <p className="text-muted-foreground text-sm">
                Our AI analyzes your unique facial features and reveals which era you truly belong to.
              </p>
            </div>

            {/* Photo upload */}
            <div>
              <p className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
                Upload Your Selfie
              </p>
              <PhotoUploader
                photoPreview={photoPreview}
                onPhotoSelect={handlePhotoSelect}
                onClear={() => { setPhoto(null); setPhotoPreview(null); }}
              />
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={!photo || analyzing}
              className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base gap-2 disabled:opacity-30"
            >
              {analyzing ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                  Analyzing your timeline…
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Find My Timeline
                </>
              )}
            </Button>

            {/* Era preview grid */}
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-3">
                Which era awaits you?
              </p>
              <div className="grid grid-cols-4 gap-2">
                {ERA_RESULTS.map((e) => (
                  <div key={e.id} className="flex flex-col items-center gap-1 py-2 rounded-xl bg-muted/40 border border-border">
                    <span className="text-2xl">{e.emoji}</span>
                    <span className="text-xs text-muted-foreground text-center leading-tight font-medium">{e.era.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-5 space-y-5"
          >
            {/* Result card */}
            <div className={`rounded-3xl bg-gradient-to-br ${result.color} p-6 text-white text-center relative overflow-hidden`}>
              <div className="absolute inset-0 bg-black/30" />
              <div className="relative z-10">
                <div className="text-6xl mb-3">{result.emoji}</div>
                <p className="text-sm uppercase tracking-widest font-semibold opacity-70 mb-1">{result.period}</p>
                <h2 className="font-display text-3xl font-bold mb-3">{result.era}</h2>
                <div className="w-16 h-0.5 bg-white/40 mx-auto mb-4" />
                <p className="text-white/90 text-base italic leading-relaxed">
                  "{result.aiReason || result.personality}"
                </p>
                {result.confidence && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <div className="h-1 flex-1 rounded-full bg-white/20">
                      <div
                        className="h-full rounded-full bg-white/70 transition-all duration-1000"
                        style={{ width: `${result.confidence}%` }}
                      />
                    </div>
                    <span className="text-sm text-white/70">{result.confidence}% match</span>
                  </div>
                )}
              </div>
            </div>

            {/* Before selfie */}
            {photoPreview && (
              <div className="flex items-center gap-3 rounded-2xl bg-card border border-border p-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={photoPreview} alt="Your selfie" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Your selfie</p>
                  <p className="text-sm text-muted-foreground mt-0.5">AI detected your timeline</p>
                </div>
              </div>
            )}

            {/* CTAs */}
            {generateError && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
                {generateError}
              </div>
            )}
            <Button
              onClick={handleTransformNow}
              disabled={generating}
              className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base gap-2 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                  Generating your portrait…
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate My {result.era} Portrait
                </>
              )}
            </Button>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleShare}
                className="flex-1 h-12 rounded-xl border-border gap-2"
              >
                {copied ? '✓ Copied!' : <><span>📲</span> Share Result</>}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setResult(null); }}
                className="flex-1 h-12 rounded-xl border-border gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            </div>

            {/* Other eras teaser */}
            <div className="rounded-2xl bg-muted/30 border border-border p-4">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Or explore any era
              </p>
              <div className="flex flex-wrap gap-2">
                {ERA_RESULTS.filter((e) => e.id !== result.id).slice(0, 5).map((e) => (
                  <button
                    key={e.id}
                    onClick={() => navigate(`/?era=${e.id}`)}
                    className="px-3 py-1.5 rounded-xl bg-secondary border border-border text-sm font-medium text-foreground hover:border-primary/40 transition-colors"
                  >
                    {e.emoji} {e.era.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-10" />
    </div>
  );
}