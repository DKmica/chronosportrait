import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Lock, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PhotoUploader from '@/components/transform/PhotoUploader';
import { buildFaceSwapPrompt } from '@/lib/faceSwapPrompt';

const ERA_PACKS = [
  {
    id: 'warriors',
    label: '⚔️ Warriors Through Time',
    description: 'Viking, Samurai, Medieval Knight, Aztec Warrior',
    isPro: false,
    eras: [
      { id: 'viking', label: 'Viking Warrior', prompt: 'Transform this person into a fierce Norse Viking warrior, wearing a horned helmet, fur-lined armor, braided hair, holding an axe, standing on a longship with stormy fjords, cinematic epic lighting, photorealistic' },
      { id: 'feudal_japan', label: 'Samurai', prompt: 'Transform this person into a noble samurai in feudal Japan, wearing full samurai armor with kabuto helmet, cherry blossom trees in background, cinematic style, photorealistic' },
      { id: 'medieval', label: 'Medieval Knight', prompt: 'Transform this person into a medieval knight, wearing ornate plate armor, in a grand castle hall with stained glass windows, candlelight, photorealistic' },
      { id: 'aztec', label: 'Aztec Warrior', prompt: 'Transform this person into an Aztec warrior, wearing elaborate feathered headdress, jade jewelry, painted body art, standing atop a grand pyramid, epic cinematic lighting, photorealistic' },
    ],
  },
  {
    id: 'royals',
    label: '👑 Royalty Across Empires',
    description: 'Egyptian, Roman, Imperial China, Mughal',
    isPro: false,
    eras: [
      { id: 'ancient_egypt', label: 'Egyptian Pharaoh', prompt: 'Transform this person into an ancient Egyptian pharaoh, wearing golden headdress, kohl eyeliner, ornate collar necklace, standing in front of pyramids, cinematic lighting, photorealistic' },
      { id: 'roman_empire', label: 'Roman Emperor', prompt: 'Transform this person into a Roman senator or emperor, wearing a white toga with purple trim, laurel wreath crown, marble columns in background, dramatic lighting, photorealistic' },
      { id: 'ancient_china', label: 'Chinese Emperor', prompt: 'Transform this person into an Imperial Chinese emperor, wearing richly embroidered dragon robes, ornate golden crown, standing in the Forbidden City, cinematic golden lighting, photorealistic' },
      { id: 'ancient_india', label: 'Mughal Royal', prompt: 'Transform this person into a Mughal emperor, wearing richly jeweled silk robes, ornate turban with pearls and rubies, seated in an opulent palace, cinematic warm golden lighting, photorealistic' },
    ],
  },
  {
    id: 'rebels',
    label: '⚡ Rebels & Outlaws',
    description: 'Pirate, Wild West, Cyberpunk, Post-Apocalyptic',
    isPro: true,
    eras: [
      { id: 'pirate', label: 'Pirate Captain', prompt: 'Transform this person into a swashbuckling pirate captain, wearing tricorn hat, leather coat, standing on a ship deck with ocean and sunset, cinematic adventure movie style, photorealistic' },
      { id: 'wild_west', label: 'Wild West Outlaw', prompt: 'Transform this person into a Wild West cowboy, wearing a wide-brimmed hat, leather duster coat, bandana, standing in a dusty western town, golden hour sunset, cinematic western movie style' },
      { id: 'cyberpunk', label: 'Cyberpunk Rebel', prompt: 'Transform this person into a cyberpunk character, with neon face paint, futuristic tech implants, holographic clothing, in a neon-lit dystopian city at night, blade runner aesthetic, photorealistic' },
      { id: 'post_apocalyptic', label: 'Wasteland Survivor', prompt: 'Transform this person into a post-apocalyptic survivor, wearing scavenged armor, face paint and battle scars, standing in a wasteland with ruined skyscrapers, Mad Max style cinematic, photorealistic' },
    ],
  },
];

export default function EraPack() {
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [selectedPack, setSelectedPack] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState([]);
  const [currentEraIndex, setCurrentEraIndex] = useState(0);
  const [error, setError] = useState(null);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const handlePhotoSelect = (file) => {
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setResults([]);
  };

  const handleGenerate = async () => {
    if (!photo || !selectedPack) return;
    setGenerating(true);
    setResults([]);
    setCurrentEraIndex(0);
    setError(null);

    const { file_url } = await base44.integrations.Core.UploadFile({ file: photo });

    const packResults = [];
    for (let i = 0; i < selectedPack.eras.length; i++) {
      setCurrentEraIndex(i);
      const era = selectedPack.eras[i];
      const prompt = buildFaceSwapPrompt(era.prompt, '');

      const transformation = await base44.entities.Transformation.create({
        original_photo_url: file_url,
        era: era.id,
        era_label: era.label,
        status: 'processing',
        pack_id: selectedPack.id,
      });

      const response = await base44.functions.invoke('transformPhoto', {
        prompt,
        original_photo_url: file_url,
        extra_photo_urls: [],
      });

      if (response.data?.url) {
        await base44.entities.Transformation.update(transformation.id, {
          transformed_photo_url: response.data.url,
          status: 'completed',
        });
        packResults.push({ ...transformation, transformed_photo_url: response.data.url, status: 'completed' });
      } else {
        await base44.entities.Transformation.update(transformation.id, { status: 'failed' });
        packResults.push({ ...transformation, status: 'failed' });
      }
      setResults([...packResults]);
    }

    setGenerating(false);
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-2 space-y-5">
        <p className="text-muted-foreground text-xs">Generate a themed portrait collection</p>
        {/* Photo upload */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Your Photo</p>
          <PhotoUploader
            photoPreview={photoPreview}
            onPhotoSelect={handlePhotoSelect}
            onClear={() => { setPhoto(null); setPhotoPreview(null); setResults([]); }}
          />
        </div>

        {/* Pack selection */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Choose a Pack</p>
          <div className="space-y-3">
            {ERA_PACKS.map((pack) => (
              <motion.button
                key={pack.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => !pack.isPro && setSelectedPack(pack)}
                className={`w-full text-left rounded-2xl border p-4 transition-all ${
                  selectedPack?.id === pack.id
                    ? 'border-primary bg-primary/10'
                    : pack.isPro
                    ? 'border-border bg-muted/30 opacity-70'
                    : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-foreground text-sm">{pack.label}</p>
                      {pack.isPro && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[9px] font-bold">
                          <Lock className="w-2.5 h-2.5" /> PRO
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{pack.description}</p>
                    <p className="text-[11px] text-muted-foreground/70 mt-1">{pack.eras.length} portraits</p>
                  </div>
                  {selectedPack?.id === pack.id && <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">{error}</div>
        )}

        {/* Generate button */}
        {results.length === 0 && (
          <Button
            onClick={handleGenerate}
            disabled={!photo || !selectedPack || generating}
            className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base gap-2 disabled:opacity-40"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating {currentEraIndex + 1}/{selectedPack?.eras.length}… {selectedPack?.eras[currentEraIndex]?.label}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Pack ({selectedPack?.eras.length || '?'} portraits)
              </>
            )}
          </Button>
        )}

        {/* Results grid */}
        {(results.length > 0 || generating) && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Your Pack {generating ? `(${results.length}/${selectedPack?.eras.length})` : '— Complete!'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {selectedPack?.eras.map((era, i) => {
                const result = results[i];
                return (
                  <motion.div
                    key={era.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: result ? 1 : 0.4, scale: 1 }}
                    className="relative aspect-square rounded-2xl overflow-hidden bg-muted cursor-pointer"
                    onClick={() => result?.id && navigate(`/result/${result.id}`)}
                  >
                    {result?.transformed_photo_url ? (
                      <>
                        <img src={result.transformed_photo_url} alt={era.label} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <p className="absolute bottom-2 left-2 right-2 text-white text-[11px] font-semibold truncate">{era.label}</p>
                      </>
                    ) : result?.status === 'failed' ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-xs text-muted-foreground text-center px-2">Failed</p>
                      </div>
                    ) : generating && i === currentEraIndex ? (
                      <div className="flex flex-col items-center justify-center h-full gap-2">
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        <p className="text-[10px] text-muted-foreground text-center px-2">{era.label}</p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-[10px] text-muted-foreground text-center px-2">{era.label}</p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {!generating && results.length > 0 && (
              <div className="mt-4 space-y-3">
                <Button
                  onClick={() => { setResults([]); setCurrentEraIndex(0); }}
                  variant="outline"
                  className="w-full h-12 rounded-xl border-border"
                >
                  Generate Another Pack
                </Button>
                <Button
                  onClick={() => navigate('/gallery')}
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                >
                  View in Gallery <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}