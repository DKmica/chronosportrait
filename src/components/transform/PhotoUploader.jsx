import React, { useRef } from 'react';
import { Camera, ImagePlus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PhotoUploader({ photoPreview, onPhotoSelect, onClear }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onPhotoSelect(file);
      e.target.value = '';
    }
  };

  return (
    <div className="relative flex flex-col items-center gap-4">
      {/* Hidden inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="user" onChange={handleFileChange} style={{ display: 'none' }} />

      <AnimatePresence mode="wait">
        {photoPreview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative rounded-2xl overflow-hidden aspect-square w-full max-w-[280px]"
          >
            <img src={photoPreview} alt="Your photo" className="w-full h-full object-cover" />
            <button
              onClick={onClear}
              className="absolute top-3 right-3 w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-[280px] aspect-square rounded-2xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-4 bg-muted/30"
          >
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
              <Camera className="w-7 h-7 text-primary" />
            </div>
            <p className="text-foreground font-medium text-sm">Add a photo</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      {!photoPreview && (
        <div className="flex gap-3 w-full max-w-[280px]">
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            <Camera className="w-4 h-4" />
            Take Photo
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors"
          >
            <ImagePlus className="w-4 h-4" />
            Upload
          </button>
        </div>
      )}
    </div>
  );
}