import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Plus, Upload, X, CheckCircle, AlertCircle, Loader2, ChevronRight, Sparkles, Trash2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MIN_PHOTOS = 5;
const MAX_PHOTOS = 10;

function StatusBadge({ status }) {
  const cfg = {
    pending:   { label: 'Pending',   color: 'text-muted-foreground', icon: Loader2, spin: false },
    analyzing: { label: 'Training…', color: 'text-yellow-400',       icon: Loader2, spin: true  },
    ready:     { label: 'Ready',     color: 'text-green-400',         icon: CheckCircle, spin: false },
    failed:    { label: 'Failed',    color: 'text-destructive',       icon: AlertCircle, spin: false },
  }[status] || { label: status, color: 'text-muted-foreground', icon: Loader2, spin: false };

  const Icon = cfg.icon;
  return (
    <span className={`flex items-center gap-1 text-xs font-semibold ${cfg.color}`}>
      <Icon className={`w-3 h-3 ${cfg.spin ? 'animate-spin' : ''}`} />
      {cfg.label}
    </span>
  );
}

export default function StyleLora() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const inputRef = useRef(null);

  const [creating, setCreating] = useState(false);
  const [modelName, setModelName] = useState('');
  const [photos, setPhotos] = useState([]); // [{file, preview, url}]
  const [uploading, setUploading] = useState(false);
  const [training, setTraining] = useState(false);
  const [error, setError] = useState(null);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const { data: loras = [], isLoading } = useQuery({
    queryKey: ['styleLoras'],
    queryFn: () => base44.entities.StyleLora.list('-created_date', 20),
    enabled: !!user,
    refetchInterval: (data) =>
      data?.some?.(l => l.status === 'analyzing') ? 3000 : false,
  });

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    files.slice(0, MAX_PHOTOS - photos.length).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotos(prev => [...prev, { file, preview: ev.target.result, url: null }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removePhoto = (i) => setPhotos(prev => prev.filter((_, idx) => idx !== i));

  const handleTrain = async () => {
    if (!modelName.trim()) { setError('Please give your model a name.'); return; }
    if (photos.length < MIN_PHOTOS) { setError(`Upload at least ${MIN_PHOTOS} photos.`); return; }
    setError(null);
    setUploading(true);

    // Upload photos
    const uploaded = await Promise.all(
      photos.map(async (p) => {
        if (p.url) return p.url;
        const { file_url } = await base44.integrations.Core.UploadFile({ file: p.file });
        return file_url;
      })
    );

    setUploading(false);
    setTraining(true);

    // Create the StyleLora record
    const lora = await base44.entities.StyleLora.create({
      user_email: user.email,
      name: modelName.trim(),
      training_photo_urls: uploaded,
      status: 'pending',
    });

    // Kick off training — fire and forget (Gemini analysis can take 30–60s)
    base44.functions.invoke('trainStyleLora', {
      lora_id: lora.id,
      photo_urls: uploaded,
    }).catch(e => console.error('trainStyleLora error:', e));

    setTraining(false);
    setCreating(false);
    setModelName('');
    setPhotos([]);
    queryClient.invalidateQueries({ queryKey: ['styleLoras'] });
  };

  const handleDelete = async (id) => {
    await base44.entities.StyleLora.delete(id);
    queryClient.invalidateQueries({ queryKey: ['styleLoras'] });
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-5 h-5 text-primary" />
          <h1 className="font-display text-xl font-bold text-foreground">My AI Style</h1>
        </div>
        <p className="text-muted-foreground text-sm ml-7">
          Train a personal model from 5–10 of your photos for higher-consistency portraits.
        </p>
      </div>

      {/* How it works */}
      <div className="mx-5 mb-5 rounded-2xl bg-primary/10 border border-primary/20 p-4">
        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> How it works
        </p>
        <div className="space-y-1.5">
          {[
            '1. Upload 5–10 clear face photos (different angles, lighting, expressions)',
            '2. AI analyzes your unique facial features and appearance',
            '3. Select your model when creating any transformation',
            '4. Get dramatically more consistent results that look like YOU',
          ].map((step, i) => (
            <p key={i} className="text-xs text-muted-foreground">{step}</p>
          ))}
        </div>
      </div>

      {/* Model list */}
      <div className="px-5 space-y-3 mb-5">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : loras.length === 0 && !creating ? (
          <div className="text-center py-10">
            <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground text-sm">No personal models yet.</p>
          </div>
        ) : (
          loras.map((lora) => (
            <motion.div
              key={lora.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-card border border-border p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-foreground truncate">{lora.name}</p>
                    <StatusBadge status={lora.status} />
                  </div>
                  {lora.style_summary && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{lora.style_summary}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {lora.training_photo_urls?.length || 0} training photos
                    {lora.transformations_using_lora > 0 && ` · Used ${lora.transformations_using_lora}×`}
                  </p>

                  {/* Training photo thumbnails */}
                  {lora.training_photo_urls?.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {lora.training_photo_urls.slice(0, 5).map((url, i) => (
                        <img key={i} src={url} alt="" className="w-8 h-8 rounded-lg object-cover border border-border" />
                      ))}
                      {lora.training_photo_urls.length > 5 && (
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center border border-border">
                          <span className="text-[9px] text-muted-foreground font-bold">+{lora.training_photo_urls.length - 5}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(lora.id)}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Create new model */}
      <div className="px-5">
        <AnimatePresence>
          {creating ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="rounded-2xl bg-card border border-border p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground">New Personal Model</p>
                <button onClick={() => { setCreating(false); setPhotos([]); setModelName(''); setError(null); }}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Model name */}
              <input
                value={modelName}
                onChange={e => setModelName(e.target.value)}
                placeholder="Model name (e.g. My Face)"
                className="w-full rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary/50"
              />

              {/* Photo upload */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Training Photos ({photos.length}/{MAX_PHOTOS})
                  </p>
                  <p className="text-xs text-muted-foreground">Min {MIN_PHOTOS}</p>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Use clear face photos: different angles, expressions, lighting. Avoid sunglasses, heavy makeup, hats, or blurry images.
                </p>

                <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display: 'none' }} />

                {/* Photo grid */}
                {photos.length > 0 && (
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    <AnimatePresence>
                      {photos.map((p, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="relative aspect-square rounded-lg overflow-hidden bg-muted"
                        >
                          <img src={p.preview} alt="" className="w-full h-full object-cover" />
                          <button
                            onClick={() => removePhoto(i)}
                            className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center"
                          >
                            <X className="w-2.5 h-2.5 text-white" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {photos.length < MAX_PHOTOS && (
                  <button
                    onClick={() => inputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <Camera className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {photos.length === 0 ? 'Upload 5–10 face photos' : `Add more (${MAX_PHOTOS - photos.length} remaining)`}
                    </span>
                  </button>
                )}

                {/* Progress bar */}
                {photos.length > 0 && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${photos.length >= MIN_PHOTOS ? 'bg-green-500' : 'bg-primary'}`}
                        style={{ width: `${(photos.length / MAX_PHOTOS) * 100}%` }}
                      />
                    </div>
                    <p className={`text-[10px] mt-1 ${photos.length >= MIN_PHOTOS ? 'text-green-400' : 'text-muted-foreground'}`}>
                      {photos.length >= MIN_PHOTOS ? '✓ Ready to train' : `${MIN_PHOTOS - photos.length} more needed`}
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
              )}

              <Button
                onClick={handleTrain}
                disabled={uploading || training || photos.length < MIN_PHOTOS || !modelName.trim()}
                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2"
              >
                {uploading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Uploading photos…</>
                ) : training ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Training AI model…</>
                ) : (
                  <><Brain className="w-4 h-4" /> Train My Model ({photos.length} photos)</>
                )}
              </Button>
            </motion.div>
          ) : (
            <Button
              key="create-btn"
              onClick={() => setCreating(true)}
              disabled={loras.length >= 5}
              className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2"
            >
              <Plus className="w-4 h-4" />
              {loras.length >= 5 ? 'Model limit reached (5 max)' : 'Create New Personal Model'}
            </Button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}