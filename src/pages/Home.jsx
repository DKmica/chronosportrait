import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import PhotoUploader from '@/components/transform/PhotoUploader';
import EraCard from '@/components/transform/EraCard';
import CustomEraCard from '@/components/transform/CustomEraCard';
import SpecialModeBar from '@/components/transform/SpecialModeBar';
import TransformingOverlay from '@/components/transform/TransformingOverlay';
import { ERAS } from '@/lib/eras';
import { SPECIAL_MODES } from '@/lib/specialModes';
import StyleSelector, { STYLE_PROMPTS } from '@/components/transform/StyleSelector';

export default function Home() {
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photo2, setPhoto2] = useState(null);
  const [photoPreview2, setPhotoPreview2] = useState(null);
  const [selectedEra, setSelectedEra] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [customDescription, setCustomDescription] = useState('');
  const [style, setStyle] = useState('balanced');
  const [isTransforming, setIsTransforming] = useState(false);

  const handlePhotoSelect = (file) => {
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleClearPhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
  };

  const handlePhotoSelect2 = (file) => {
    setPhoto2(file);
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview2(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleClearPhoto2 = () => {
    setPhoto2(null);
    setPhotoPreview2(null);
  };

  const handleModeSelect = (modeId) => {
    const next = selectedMode === modeId ? null : modeId;
    setSelectedMode(next);
    setSelectedEra(null);
    if (next !== 'couples') {
      setPhoto2(null);
      setPhotoPreview2(null);
    }
  };

  const handleTransform = async () => {
    if (!photo || !selectedEra) return;

    setIsTransforming(true);
    const isCustom = selectedEra === 'custom';
    const mode = SPECIAL_MODES.find((m) => m.id === selectedMode);
    const baseEra = isCustom
      ? { id: 'custom', label: 'Custom', prompt: customDescription }
      : ERAS.find((e) => e.id === selectedEra);

    const modePrefix = mode ? mode.promptPrefix : '';
    const styleSuffix = STYLE_PROMPTS[style];
    const finalPrompt = isCustom
      ? `${modePrefix}Transform this person: ${customDescription}. ${styleSuffix}`
      : `${modePrefix}${baseEra.prompt} ${styleSuffix}`;

    const { file_url } = await base44.integrations.Core.UploadFile({ file: photo });
    const extraUrls = [];
    if (selectedMode === 'couples' && photo2) {
      const { file_url: url2 } = await base44.integrations.Core.UploadFile({ file: photo2 });
      extraUrls.push(url2);
    }

    const transformation = await base44.entities.Transformation.create({
      original_photo_url: file_url,
      era: baseEra.id,
      era_label: isCustom ? customDescription.slice(0, 40) : baseEra.label,
      status: 'processing',
    });

    const result = await base44.integrations.Core.GenerateImage({
      prompt: finalPrompt,
      existing_image_urls: [file_url, ...extraUrls],
    });

    await base44.entities.Transformation.update(transformation.id, {
      transformed_photo_url: result.url,
      status: 'completed',
    });

    setIsTransforming(false);
    navigate(`/result/${transformation.id}`);
  };

  const activeEra = ERAS.find((e) => e.id === selectedEra);
  const activeMode = SPECIAL_MODES.find((m) => m.id === selectedMode);
  const filteredEras = selectedMode && activeMode?.eraIds
    ? ERAS.filter((e) => activeMode.eraIds.includes(e.id))
    : ERAS;

  const canTransform = photo && selectedEra && !isTransforming &&
    !(selectedEra === 'custom' && !customDescription.trim()) &&
    !(selectedMode === 'couples' && !photo2);

  return (
    <div className="min-h-screen">
      <AnimatePresence>
        {isTransforming && (
          <TransformingOverlay eraLabel={selectedEra === 'custom' ? customDescription.slice(0, 30) : activeEra?.label} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Clock className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground leading-tight">Chronos Booth</h1>
            <p className="text-muted-foreground text-[10px] leading-none">Cinematic AI Time Travel</p>
          </div>
        </motion.div>
      </div>

      {/* Photo Upload Section */}
      <div className="px-5 mb-5">
        {selectedMode === 'couples' ? (
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground text-center mb-2 font-medium">Person 1</p>
              <PhotoUploader
                photoPreview={photoPreview}
                onPhotoSelect={handlePhotoSelect}
                onClear={handleClearPhoto}
              />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground text-center mb-2 font-medium">Person 2</p>
              <PhotoUploader
                photoPreview={photoPreview2}
                onPhotoSelect={handlePhotoSelect2}
                onClear={handleClearPhoto2}
              />
            </div>
          </div>
        ) : (
          <PhotoUploader
            photoPreview={photoPreview}
            onPhotoSelect={handlePhotoSelect}
            onClear={handleClearPhoto}
          />
        )}
      </div>

      {/* Special Modes */}
      <div className="mb-5">
        <div className="px-5 mb-2">
          <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Special Modes
          </h2>
        </div>
        <SpecialModeBar
          modes={SPECIAL_MODES}
          selectedMode={selectedMode}
          onSelect={handleModeSelect}
        />
      </div>

      {/* Style Selector */}
      <div className="mb-5">
        <StyleSelector value={style} onChange={setStyle} />
      </div>

      {/* Era Selection */}
      <div className="px-5">
        <h2 className="font-display text-lg font-semibold text-foreground mb-3">
          {selectedMode ? `${activeMode?.label} Eras` : 'Choose Your Era'}
        </h2>
        <div className="grid grid-cols-3 gap-2.5">
          {filteredEras.map((era, index) => (
            <EraCard
              key={era.id}
              era={era}
              index={index}
              isSelected={selectedEra === era.id}
              onClick={() => setSelectedEra(era.id)}
            />
          ))}
          {!selectedMode && (
            <CustomEraCard
              isSelected={selectedEra === 'custom'}
              onClick={() => setSelectedEra('custom')}
            />
          )}
        </div>

        {/* Custom era description input */}
        {selectedEra === 'custom' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <textarea
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="Describe your vision... e.g. 'a samurai warrior in feudal Japan' or 'a futuristic superhero'"
              className="w-full rounded-xl bg-secondary/60 border border-border text-foreground text-sm placeholder:text-muted-foreground px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              rows={3}
            />
          </motion.div>
        )}
      </div>

      {/* Transform Button */}
      <div className="px-5 py-6">
        <Button
          onClick={handleTransform}
          disabled={!canTransform}
          className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base gap-2 disabled:opacity-30"
        >
          <Sparkles className="w-5 h-5" />
          {activeMode ? `${activeMode.label} Transform` : 'Transform Me'}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}