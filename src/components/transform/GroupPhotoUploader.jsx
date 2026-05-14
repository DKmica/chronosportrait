import React, { useRef, useState } from 'react';
import { X, Plus, GripVertical, ArrowUp, ArrowDown, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Layout preview description for each count
const LAYOUT_LABELS = {
  2: ['Left', 'Right'],
  3: ['Center', 'Left', 'Right'],
  4: ['Front-Left', 'Front-Right', 'Back-Left', 'Back-Right'],
  5: ['Center', 'Left-Center', 'Right-Center', 'Far-Left', 'Far-Right'],
  6: ['Front-Center', 'Front-Left', 'Front-Right', 'Back-Left', 'Back-Center', 'Back-Right'],
};

export default function GroupPhotoUploader({ photos, onAdd, onRemove, onReorder, maxPhotos = 10 }) {
  const inputRef = useRef(null);
  const [dragIdx, setDragIdx] = useState(null);
  const [showLayout, setShowLayout] = useState(false);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    files.slice(0, maxPhotos - photos.length).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => onAdd(file, ev.target.result);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const movePhoto = (from, to) => {
    if (to < 0 || to >= photos.length) return;
    if (onReorder) onReorder(from, to);
  };

  const layoutLabels = LAYOUT_LABELS[photos.length] || [];

  return (
    <div className="space-y-3">
      <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: 'none' }} />

      {/* Layout toggle */}
      {photos.length >= 2 && (
        <button
          onClick={() => setShowLayout(v => !v)}
          className="flex items-center gap-1.5 text-xs text-primary font-semibold"
        >
          <Users className="w-3.5 h-3.5" />
          {showLayout ? 'Hide' : 'Set'} Positions
        </button>
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className={`grid gap-2 ${photos.length === 1 ? 'grid-cols-1 max-w-[160px]' : 'grid-cols-3'}`}>
          <AnimatePresence>
            {photos.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                draggable
                onDragStart={() => setDragIdx(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIdx !== null && dragIdx !== i) movePhoto(dragIdx, i);
                  setDragIdx(null);
                }}
                className={`relative aspect-square rounded-xl overflow-hidden bg-muted cursor-grab active:cursor-grabbing border-2 transition-colors ${
                  dragIdx === i ? 'border-primary/60 opacity-60' : 'border-transparent'
                }`}
              >
                <img src={p.preview} alt={`Person ${i + 1}`} className="w-full h-full object-cover" />

                {/* Controls overlay */}
                <div className="absolute inset-0 bg-black/20" />

                <button
                  onClick={() => onRemove(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center z-10"
                >
                  <X className="w-2.5 h-2.5 text-white" />
                </button>

                {/* Position label */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-1">
                  <span className="text-white text-[9px] font-bold block">#{i + 1}</span>
                  {showLayout && layoutLabels[i] && (
                    <span className="text-white/70 text-[8px] block leading-tight">{layoutLabels[i]}</span>
                  )}
                </div>

                {/* Move arrows (only when layout mode is on) */}
                {showLayout && (
                  <div className="absolute top-1 left-1 flex flex-col gap-0.5 z-10">
                    {i > 0 && (
                      <button
                        onClick={() => movePhoto(i, i - 1)}
                        className="w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                      >
                        <ArrowUp className="w-2.5 h-2.5 text-white" />
                      </button>
                    )}
                    {i < photos.length - 1 && (
                      <button
                        onClick={() => movePhoto(i, i + 1)}
                        className="w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                      >
                        <ArrowDown className="w-2.5 h-2.5 text-white" />
                      </button>
                    )}
                  </div>
                )}

                <div className="absolute top-1 right-6 z-10">
                  <GripVertical className="w-3 h-3 text-white/50" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add button */}
      {photos.length < maxPhotos && (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 hover:bg-muted/40 transition-colors"
        >
          <Plus className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground font-medium">
            {photos.length === 0
              ? 'Add photos (2–10 people)'
              : `Add more (${maxPhotos - photos.length} remaining)`}
          </span>
        </button>
      )}

      {photos.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          {photos.length} person{photos.length !== 1 ? 's' : ''} · Drag to reorder positions
        </p>
      )}
    </div>
  );
}