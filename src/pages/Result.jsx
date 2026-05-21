import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Download, RotateCcw, AlertTriangle, Globe, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VideoGenerator from '@/components/result/VideoGenerator';
import ShareToCommunityButton from '@/components/community/ShareToCommmunityButton';
import BeforeAfterSlider from '@/components/result/BeforeAfterSlider';
import SharePanel from '@/components/share/SharePanel';
import BannerAd from '@/components/ads/BannerAd';
import { showInterstitialAd, recordTransformationCompleted } from '@/lib/admob';
import { showWatermark, WATERMARK_TEXT } from '@/lib/appConfig';
import { getOrCreateProfile } from '@/lib/usageLimit';

const STUCK_TIMEOUT_MS = 5 * 60 * 1000;

export default function Result() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [liveTransformation, setLiveTransformation] = useState(null);
  const [viewMode, setViewMode] = useState('result'); // 'result' | 'compare'
  const [isStuck, setIsStuck] = useState(false);
  const [spotlightOptIn, setSpotlightOptIn] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [sharedToSpotlight, setSharedToSpotlight] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  const { data: transformation, isLoading, isError, error } = useQuery({
    queryKey: ['transformation', id],
    enabled: !!id,
    retry: false,
    queryFn: async () => {
      const res = await base44.functions.invoke('getTransformation', { id });
      if (res.data?.error) throw new Error(res.data.error);
      if (!res.data?.transformation) throw new Error('Transformation not found');
      return res.data.transformation;
    },
  });

  const t = liveTransformation || transformation;

  // Load user profile for plan/ad checks
  useEffect(() => {
    base44.auth.me().then(user => {
      if (user?.email) getOrCreateProfile(user.email).then(setUserProfile);
    }).catch(() => {});
  }, []);

  // Show interstitial ad when transformation result is displayed (free users only)
  useEffect(() => {
    if (t?.status === 'completed') {
      recordTransformationCompleted();
      showInterstitialAd(userProfile?.plan).catch(() => {});
    }
  }, [t?.id, t?.status, userProfile?.plan]);

  // Detect stuck processing jobs
  useEffect(() => {
    if (!t) return;
    if (t.status === 'processing' && !t.transformed_photo_url) {
      const age = Date.now() - new Date(t.created_date).getTime();
      if (age > STUCK_TIMEOUT_MS) {
        setIsStuck(true);
        base44.entities.Transformation.update(t.id, { status: 'failed' }).catch(() => {});
      }
    }
  }, [t?.id, t?.status, t?.transformed_photo_url]);

  const handleRetry = () => navigate(`/?era=${encodeURIComponent(t?.era || '')}`);

  const handleSpotlightOptIn = async (checked) => {
    setSpotlightOptIn(checked);
    if (checked && t?.status === 'completed' && t?.transformed_photo_url && !sharedToSpotlight) {
      setIsSharing(true);
      const user = await base44.auth.me().catch(() => null);
      await base44.entities.CommunityPost.create({
        transformation_id: t.id,
        image_url: t.transformed_photo_url,
        era_label: t.era_label,
        author_name: user?.full_name || 'Anonymous',
        likes_count: 0,
        liked_by: [],
      });
      setIsSharing(false);
      setSharedToSpotlight(true);
    }
  };

  const handleDownload = async () => {
    if (!t?.transformed_photo_url) return;
    const res = await fetch(t.transformed_photo_url);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chronosbooth-${(t.era_label || 'portrait').toLowerCase().replace(/\s+/g, '-')}.jpg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const userPlan = userProfile?.plan || 'free';
  const needsWatermark = showWatermark(userPlan);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !t) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-5 text-center">
        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-destructive" />
        </div>
        <div>
          <h1 className="font-display text-xl font-semibold text-foreground">Transformation unavailable</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {error?.message || 'We could not load this transformation. It may have been deleted.'}
          </p>
        </div>
        <Button onClick={() => navigate('/')} className="rounded-xl">Back to ChronosBooth</Button>
      </div>
    );
  }

  if (t.status === 'failed' || isStuck) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-5 text-center">
        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-destructive" />
        </div>
        <div>
          <h1 className="font-display text-xl font-semibold text-foreground">Generation failed</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Generation took too long or may have failed. Please retry with clearer, front-facing photos.
          </p>
        </div>
        <Button onClick={handleRetry} className="rounded-xl gap-2">
          <RotateCcw className="w-4 h-4" />
          Retry with Same Era
        </Button>
        <Button variant="ghost" onClick={() => navigate('/')} className="rounded-xl text-muted-foreground">
          Back to ChronosBooth
        </Button>
      </div>
    );
  }

  const canCompare = t.status === 'completed' && t.transformed_photo_url && t.original_photo_url;

  return (
    <div className="min-h-screen pb-12">
      {/* Era title */}
      <div className="px-5 pt-3 pb-2">
        <h2 className="font-display text-lg font-semibold text-center text-foreground">{t.era_label}</h2>
      </div>

      {/* View mode tabs */}
      {canCompare && (
        <div className="flex gap-2 px-5 mb-4">
          {[
            { id: 'result', label: '🖼️ Result' },
            { id: 'compare', label: '↔️ Compare' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all border ${
                viewMode === tab.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-secondary border-border text-muted-foreground hover:border-primary/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Main content */}
      <div className="px-5">
        <AnimatePresence mode="wait">
          {viewMode === 'result' && (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="relative rounded-2xl overflow-hidden aspect-square bg-muted"
              >
                {t.status === 'completed' && t.transformed_photo_url ? (
                  <img src={t.transformed_photo_url} alt={`Transformed to ${t.era_label}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
                  </div>
                )}

                {/* Watermark overlay — free users only */}
                {needsWatermark && t.status === 'completed' && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm">
                    <span className="text-primary text-xs font-bold">⏰ {WATERMARK_TEXT}</span>
                  </div>
                )}

                {/* Pro users: clean brand badge */}
                {!needsWatermark && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm">
                    <span className="text-primary/80 text-[10px] font-semibold">ChronosBooth</span>
                  </div>
                )}
              </motion.div>

              {/* Original photos */}
              <div className="mt-4">
                <p className="text-muted-foreground text-sm mb-2 font-medium uppercase tracking-wider">
                  Original{t.extra_photo_urls?.length > 0 ? 's' : ''}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-border flex-shrink-0">
                    <img src={t.original_photo_url} alt="Original" className="w-full h-full object-cover" />
                  </div>
                  {t.extra_photo_urls?.map((url, i) => (
                    <div key={i} className="w-16 h-16 rounded-xl overflow-hidden border-2 border-border flex-shrink-0">
                      <img src={url} alt={`Person ${i + 2}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {viewMode === 'compare' && canCompare && (
            <motion.div key="compare" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <BeforeAfterSlider
                beforeUrl={t.original_photo_url}
                afterUrl={t.transformed_photo_url}
                label={t.era_label}
              />
              <p className="text-center text-sm text-muted-foreground mt-3">← Drag the handle to compare →</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cinematic Video */}
      {t.status === 'completed' && viewMode === 'result' && (
        <div className="px-5 mt-6">
          <VideoGenerator transformation={t} onVideoReady={setLiveTransformation} />
        </div>
      )}

      {/* Banner Ad — below image, above action buttons, free users only */}
      <div className="px-5 mt-4">
        <BannerAd plan={userPlan} />
      </div>

      {/* Actions */}
      {t.status === 'completed' && t.transformed_photo_url && (
        <div className="px-5 mt-4 space-y-3">
          {/* Primary actions: Download + Share */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-xl gap-2 border-border"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4" />
              {needsWatermark ? 'Download' : 'Save HD'}
            </Button>
            <SharePanel transformation={t} showWatermark={needsWatermark} />
          </div>

          {/* Quick social share buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={async () => {
                const res = await fetch(t.transformed_photo_url);
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `chronosbooth-${(t.era_label||'portrait').toLowerCase().replace(/\s+/g,'-')}.jpg`; a.click();
                URL.revokeObjectURL(url);
                setTimeout(() => { window.location.href = 'instagram://library'; }, 800);
              }}
              className="flex items-center justify-center gap-2 h-11 rounded-xl border border-border bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 transition-colors"
            >
              <span className="text-lg">📸</span>
              <span className="text-xs font-semibold text-foreground">Instagram</span>
            </button>
            <button
              onClick={async () => {
                const res = await fetch(t.transformed_photo_url);
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `chronosbooth-${(t.era_label||'portrait').toLowerCase().replace(/\s+/g,'-')}.jpg`; a.click();
                URL.revokeObjectURL(url);
                setTimeout(() => { window.location.href = 'tiktok://'; }, 800);
              }}
              className="flex items-center justify-center gap-2 h-11 rounded-xl border border-border bg-secondary/60 hover:bg-secondary transition-colors"
            >
              <span className="text-lg">🎵</span>
              <span className="text-xs font-semibold text-foreground">TikTok</span>
            </button>
            <button
              onClick={() => {
                const publicLink = `${window.location.origin}/result/${t.id}`;
                const caption = `Check out my ${t.era_label} portrait made with ChronosBooth! 🎨`;
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicLink)}&quote=${encodeURIComponent(caption)}`, '_blank', 'width=600,height=400');
              }}
              className="flex items-center justify-center gap-2 h-11 rounded-xl border border-border bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
            >
              <span className="text-lg">👥</span>
              <span className="text-xs font-semibold text-foreground">Facebook</span>
            </button>
          </div>

          {/* Pro upsell for free users */}
          {needsWatermark && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-primary">Go Pro</span> to remove ads, remove watermarks,
                unlock HD downloads, create videos, and access premium eras.{' '}
                <button onClick={() => navigate('/pricing')} className="text-primary underline font-semibold">Upgrade →</button>
              </p>
            </div>
          )}

          {/* Community Spotlight opt-in */}
          <div
            onClick={() => !sharedToSpotlight && handleSpotlightOptIn(!spotlightOptIn)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer select-none ${
              spotlightOptIn ? 'border-primary/60 bg-primary/10' : 'border-border bg-secondary/40'
            } ${sharedToSpotlight ? 'opacity-75 cursor-default' : ''}`}
          >
            <div className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all ${
              spotlightOptIn ? 'bg-primary border-primary' : 'border-muted-foreground/40'
            }`}>
              {spotlightOptIn && <span className="text-primary-foreground text-xs font-bold">✓</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-primary inline" />
                Feature in Community Spotlight
                {isSharing && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                {sharedToSpotlight && (
                  <span className="text-[10px] text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded-full">Live!</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {sharedToSpotlight
                  ? 'Your portrait is featured on the ChronosBooth home page.'
                  : 'Let others discover your portrait on the home page.'}
              </p>
            </div>
          </div>

          <ShareToCommunityButton transformation={t} />

          <Button
            onClick={() => navigate('/')}
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            New Transformation
          </Button>
        </div>
      )}
    </div>
  );
}