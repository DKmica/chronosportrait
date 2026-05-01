import React, { useRef } from 'react';
import { Camera, ImagePlus, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GroupPhotoUploader({ photos, onAdd, onRemove }) {
  const inputRef = useRef(null);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => onAdd(file, ev.target.result);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: 'none' }} />

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <AnimatePresence>
            {photos.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative aspect-square rounded-xl overflow-hidden bg-muted"
              >
                <img src={p.preview} alt={`Person ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => onRemove(i)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
                <div className="absolute bottom-1 left-1 bg-black/50 rounded-md px-1.5 py-0.5">
                  <span className="text-white text-[9px] font-medium">#{i + 1}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add button */}
      <button
        onClick={() => inputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 hover:bg-muted/40 transition-colors"
      >
        <Plus className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground font-medium">
          {photos.length === 0 ? 'Add photos of everyone' : 'Add more people'}
        </span>
      </button>

      {photos.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">{photos.length} person{photos.length !== 1 ? 's' : ''} added</p>
      )}
    </div>
  );
}