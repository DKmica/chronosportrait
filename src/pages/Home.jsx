import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import PhotoUploader from '@/components/transform/PhotoUploader';
import EraCard from '@/components/transform/EraCard';
import TransformingOverlay from '@/components/transform/TransformingOverlay';
import { ERAS } from '@/lib/eras';

export default function Home() {
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [selectedEra, setSelectedEra] = useState(null);
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

  const handleTransform = async () => {
    if (!photo || !selectedEra) return;

    setIsTransforming(true);
    const era = ERAS.find((e) => e.id === selectedEra);

    // Upload the original photo
    const { file_url } = await base44.integrations.Core.UploadFile({ file: photo });

    // Create transformation record
    const transformation = await base44.entities.Transformation.create({
      original_photo_url: file_url,
      era: era.id,
      era_label: era.label,
      status: 'processing',
    });

    // Generate the transformed image
    const result = await base44.integrations.Core.GenerateImage({
      prompt: era.prompt,
      existing_image_urls: [file_url],
    });

    // Update the transformation with result
    await base44.entities.Transformation.update(transformation.id, {
      transformed_photo_url: result.url,
      status: 'completed',
    });

    setIsTransforming(false);
    navigate(`/result/${transformation.id}`);
  };

  const era = ERAS.find((e) => e.id === selectedEra);

  return (
    <div className="min-h-screen">
      <AnimatePresence>
        {isTransforming && <TransformingOverlay eraLabel={era?.label} />}
      </AnimatePresence>

      {/* Header */}
      <div className="px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2"
        >
          <Sparkles className="w-5 h-5 text-primary" />
          <h1 className="font-display text-xl font-bold text-foreground">TimeLens</h1>
        </motion.div>
        <p className="text-muted-foreground text-xs mt-1 ml-7">
          Transform yourself across time
        </p>
      </div>

      {/* Photo Upload Section */}
      <div className="px-5 mb-6">
        <PhotoUploader
          photoPreview={photoPreview}
          onPhotoSelect={handlePhotoSelect}
          onClear={handleClearPhoto}
        />
      </div>

      {/* Era Selection */}
      <div className="px-5">
        <h2 className="font-display text-lg font-semibold text-foreground mb-3">
          Choose Your Era
        </h2>
        <div className="grid grid-cols-3 gap-2.5">
          {ERAS.map((era, index) => (
            <EraCard
              key={era.id}
              era={era}
              index={index}
              isSelected={selectedEra === era.id}
              onClick={() => setSelectedEra(era.id)}
            />
          ))}
        </div>
      </div>

      {/* Transform Button */}
      <div className="px-5 py-6">
        <Button
          onClick={handleTransform}
          disabled={!photo || !selectedEra || isTransforming}
          className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base gap-2 disabled:opacity-30"
        >
          <Sparkles className="w-5 h-5" />
          Transform Me
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}