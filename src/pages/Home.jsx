import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import PhotoUploader from "@/components/PhotoUploader";
import EraCard from "@/components/EraCard";
import TransformationResult from "@/components/TransformationResult";
import { ERAS } from "@/lib/eras";

export default function Home() {
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [selectedEra, setSelectedEra] = useState(null);
  const [isTransforming, setIsTransforming] = useState(false);
  const [result, setResult] = useState(null);

  const handlePhotoSelect = (file) => {
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleClearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setSelectedEra(null);
  };

  const handleTransform = async () => {
    if (!photoFile || !selectedEra) return;

    setIsTransforming(true);
    setResult(null);

    // Upload the original photo
    const { file_url } = await base44.integrations.Core.UploadFile({ file: photoFile });

    // Create a record in processing state
    const record = await base44.entities.Transformation.create({
      original_image_url: file_url,
      era: selectedEra.name,
      era_key: selectedEra.key,
      status: "processing",
    });

    // Generate the transformed image
    const { url: transformedUrl } = await base44.integrations.Core.GenerateImage({
      prompt: selectedEra.prompt,
      existing_image_urls: [file_url],
    });

    // Update the record
    await base44.entities.Transformation.update(record.id, {
      transformed_image_url: transformedUrl,
      status: "completed",
    });

    setResult({
      ...record,
      transformed_image_url: transformedUrl,
      status: "completed",
    });
    setIsTransforming(false);
    toast.success("Transformation complete!");
  };

  const handleReset = () => {
    setResult(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    setSelectedEra(null);
  };

  // Show result screen
  if (isTransforming || result) {
    return (
      <TransformationResult
        transformation={result}
        era={selectedEra}
        isLoading={isTransforming}
        onBack={handleReset}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h1 className="font-heading font-bold text-2xl text-foreground">
          Travel Through Time
        </h1>
        <p className="text-muted-foreground text-sm font-body max-w-xs mx-auto">
          Upload your photo and AI will transform you into any era or scenario
        </p>
      </motion.div>

      {/* Step 1: Upload Photo */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center font-body">
            1
          </span>
          <h2 className="font-heading font-semibold text-sm text-foreground">
            Upload Your Photo
          </h2>
        </div>
        <PhotoUploader
          photoPreview={photoPreview}
          onPhotoSelect={handlePhotoSelect}
          onClear={handleClearPhoto}
        />
      </motion.section>

      {/* Step 2: Choose Era */}
      {photoPreview && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center font-body">
              2
            </span>
            <h2 className="font-heading font-semibold text-sm text-foreground">
              Choose Your Era
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {ERAS.map((era) => (
              <EraCard
                key={era.key}
                era={era}
                isSelected={selectedEra?.key === era.key}
                onSelect={setSelectedEra}
              />
            ))}
          </div>
        </motion.section>
      )}

      {/* Transform Button */}
      {photoPreview && selectedEra && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pb-4"
        >
          <Button
            onClick={handleTransform}
            className="w-full h-14 text-base font-heading font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity rounded-xl shadow-lg shadow-primary/25"
          >
            <Wand2 className="w-5 h-5 mr-2" />
            Transform Me into {selectedEra.name}
          </Button>
        </motion.div>
      )}
    </div>
  );
}