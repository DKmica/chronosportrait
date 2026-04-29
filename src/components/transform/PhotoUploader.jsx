import React from 'react';
import { Camera, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PhotoUploader({ photoPreview, onPhotoSelect, onClear }) {
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onPhotoSelect(file);
    }
  };

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {photoPreview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative rounded-2xl overflow-hidden aspect-square max-w-[280px] mx-auto"
          >
            <img
              src={photoPreview}
              alt="Your photo"
              className="w-full h-full object-cover"
            />
            <button
              onClick={onClear}
              className="absolute top-3 right-3 w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </motion.div>
        ) : (
          <motion.label
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-[280px] mx-auto aspect-square rounded-2xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-4 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
              <Camera className="w-7 h-7 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-foreground font-medium text-sm">Upload a selfie</p>
              <p className="text-muted-foreground text-xs mt-1">
                Tap to take or choose a photo
              </p>
            </div>
          </motion.label>
        )}
      </AnimatePresence>
    </div>
  );
}