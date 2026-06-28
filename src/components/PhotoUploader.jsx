import React, { useRef, useState } from "react";
import { X, ImagePlus, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import imageCompression from "browser-image-compression";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1024,
  useWebWorker: true,
};

export default function PhotoUploader({ photoPreview, onPhotoSelect, onClear }) {
  const fileInputRef = useRef(null);
  const [compressing, setCompressing] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    try {
      const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
      const compressedFile = new File([compressed], file.name, { type: compressed.type || file.type });
      onPhotoSelect(compressedFile);
    } catch (err) {
      console.error("Compression failed, using original:", err);
      onPhotoSelect(file);
    } finally {
      setCompressing(false);
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleFileChange}
      />

      {compressing && (
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Optimizing photo…
        </div>
      )}

      <AnimatePresence mode="wait">
        {!photoPreview ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative"
          >
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-square max-w-[280px] mx-auto rounded-2xl border-2 border-dashed border-primary/40 bg-secondary/50 flex flex-col items-center justify-center gap-4 hover:border-primary/70 hover:bg-secondary/80 transition-all duration-300 group"
            >
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                <ImagePlus className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center px-4">
                <p className="text-foreground font-body font-medium text-sm">
                  Tap to upload your photo
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  or take a selfie
                </p>
              </div>
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative max-w-[280px] mx-auto"
          >
            <div className="aspect-square rounded-2xl overflow-hidden border-2 border-primary/30 shadow-lg shadow-primary/10">
              <img
                src={photoPreview}
                alt="Your photo"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={onClear}
              className="absolute -top-2 -right-2 w-8 h-8 bg-destructive rounded-full flex items-center justify-center shadow-lg hover:bg-destructive/90 transition-colors"
            >
              <X className="w-4 h-4 text-destructive-foreground" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}