import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, RotateCcw } from 'lucide-react';
import ShareButton from '@/components/result/ShareButton';
import { Button } from '@/components/ui/button';
import VideoGenerator from '@/components/result/VideoGenerator';
import ShareToCommunityButton from '@/components/community/ShareToCommmunityButton';

export default function Result() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [liveTransformation, setLiveTransformation] = useState(null);

  const { data: transformation, isLoading } = useQuery({
    queryKey: ['transformation', id],
    queryFn: () => base44.entities.Transformation.filter({ id }),
    select: (data) => data[0],
  });

  const t = liveTransformation || transformation;

  if (isLoading || !t) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!t && !isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-5">
        <p className="text-muted-foreground">Transformation not found</p>
        <Button variant="outline" onClick={() => navigate('/')}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="p-2 -ml-2">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-display text-lg font-semibold">{t.era_label}</h1>
        <div className="w-9" />
      </div>

      {/* Result Image */}
      <div className="px-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative rounded-2xl overflow-hidden aspect-square bg-muted"
        >
          {t.status === 'completed' && t.transformed_photo_url ? (
            <img
              src={t.transformed_photo_url}
              alt={`Transformed to ${t.era_label}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
            </div>
          )}
        </motion.div>
      </div>

      {/* Before / After Comparison */}
      <div className="px-5 mt-4">
        <p className="text-muted-foreground text-xs mb-2 font-medium uppercase tracking-wider">Original</p>
        <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-border">
          <img src={t.original_photo_url} alt="Original" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Cinematic Video Section */}
      {t.status === 'completed' && (
        <div className="px-5 mt-6">
          <VideoGenerator
            transformation={t}
            onVideoReady={setLiveTransformation}
          />
        </div>
      )}

      {/* Actions */}
      <div className="px-5 mt-6 space-y-3 pb-6">
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-xl gap-2 border-border"
            onClick={() => t.transformed_photo_url && window.open(t.transformed_photo_url, '_blank')}
          >
            <Download className="w-4 h-4" />
            Save Photo
          </Button>
          <ShareButton transformation={t} />
        </div>

        {t.status === 'completed' && t.transformed_photo_url && (
          <ShareToCommunityButton transformation={t} />
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