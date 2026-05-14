import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Download, RotateCcw, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VideoGenerator from '@/components/result/VideoGenerator';
import ShareToCommunityButton from '@/components/community/ShareToCommmunityButton';
import BeforeAfterSlider from '@/components/result/BeforeAfterSlider';
import ViralShareCard from '@/components/share/ViralShareCard';
import SocialDeeplinks from '@/components/share/SocialDeeplinks';
import { showInterstitialAd } from '@/lib/admob';

export default function Result() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [liveTransformation, setLiveTransformation] = useState(null);
  const [viewMode, setViewMode] = useState('result'); // 'result' | 'compare' | 'share'

  const { data: transformation, isLoading, isError, error } = useQuery({
    queryKey: ['transformation', id],
    enabled: !!id,
    retry: false,
    queryFn: async () => {
      const res = await base44.functions.invoke('getTransformation', { id });
      if (res.data?.error) {
        throw new Error(res.data.error);
      }
      if (!res.data?.transformation) {
        throw new Error('Transformation not found');
      }
      return res.data.transformation;
    },
  });

  const t = liveTransformation || transformation;

  // Show interstitial ad when transformation result is displayed
  useEffect(() => {
    if (t?.status === 'completed') {
      showInterstitialAd().catch(() => {});
    }
  }, [t?.id, t?.status]);

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
            {error?.message || 'We could not load this transformation. It may have been deleted or you may not have access.'}
          </p>
        </div>
        <Button onClick={() => navigate('/')} className="rounded-xl">Back to Home</Button>
      </div>
    );
  }

  const canCompare = t.status === 'completed' && t.transformed_photo_url && t.original_photo_url;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-display text-lg font-semibold">{t.era_label}</h1>
        <div className="w-9" />
      </div>

      {/* View mode tabs */}
      {canCompare && (
        <div className="flex gap-2 px-5 mb-4">
          {[
            { id: 'result', label: '🖼️ Result' },
            { id: 'compare', label: '↔️ Compare' },
            { id: 'share', label: '📲 Share Card' },
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
                <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm">
                  <span className="text-primary text-xs font-bold">⏰ Chronos Booth</span>
                </div>
              </motion.div>

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

          {viewMode === 'share' && (
            <motion.div key="share" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ViralShareCard transformation={t} />
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

      {/* Actions */}
      <div className="px-5 mt-6 space-y-3 pb-8">
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-xl gap-2 border-border"
            onClick={() => t.transformed_photo_url && window.open(t.transformed_photo_url, '_blank')}
          >
            <Download className="w-4 h-4" />
            Save HD
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-xl gap-2 border-border"
            onClick={() => setViewMode('share')}
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>

        {t.status === 'completed' && t.transformed_photo_url && (
          <>
            <SocialDeeplinks transformation={t} />
            <ShareToCommunityButton transformation={t} />
          </>
        )}

        <Button
          onClick={() => navigate('/')}
          className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          New Transformation
        </Button>
      </div>
    </div>
  );
}