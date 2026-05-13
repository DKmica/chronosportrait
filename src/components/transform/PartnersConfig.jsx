import React from 'react';
import { motion } from 'framer-motion';
import PhotoUploader from './PhotoUploader';
import { RELATIONSHIP_VIBES, PARTNER_STYLES } from '@/lib/specialModes';

export default function PartnersConfig({
  photoPreviewA, onPhotoSelectA, onClearA,
  photoPreviewB, onPhotoSelectB, onClearB,
  relationshipVibe, onRelationshipVibeChange,
  customRelationshipVibe, onCustomRelationshipVibeChange,
  styleA, onStyleAChange, customStyleA, onCustomStyleAChange,
  styleB, onStyleBChange, customStyleB, onCustomStyleBChange,
}) {
  return (
    <div className="space-y-5">
      {/* Photos */}
      <div className="flex gap-3">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground text-center mb-2 font-semibold uppercase tracking-wide">Person A</p>
          <PhotoUploader photoPreview={photoPreviewA} onPhotoSelect={onPhotoSelectA} onClear={onClearA} />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground text-center mb-2 font-semibold uppercase tracking-wide">Person B</p>
          <PhotoUploader photoPreview={photoPreviewB} onPhotoSelect={onPhotoSelectB} onClear={onClearB} />
        </div>
      </div>

      {/* Relationship Vibe */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Relationship Vibe</p>
        <div className="flex flex-wrap gap-2">
          {RELATIONSHIP_VIBES.map((v) => (
            <button
              key={v.id}
              onClick={() => onRelationshipVibeChange(v.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                relationshipVibe === v.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-secondary text-foreground border-border hover:border-primary/40'
              }`}
            >
              <span>{v.emoji}</span> {v.label}
            </button>
          ))}
        </div>
        {relationshipVibe === 'custom' && (
          <motion.input
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            type="text"
            value={customRelationshipVibe}
            onChange={(e) => onCustomRelationshipVibeChange(e.target.value)}
            placeholder="e.g. rivals turned allies, mentor and student…"
            className="mt-2 w-full rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        )}
      </div>

      {/* Style per person */}
      <div className="grid grid-cols-2 gap-3">
        <StylePicker
          label="Person A Style"
          value={styleA}
          onChange={onStyleAChange}
          customValue={customStyleA}
          onCustomChange={onCustomStyleAChange}
        />
        <StylePicker
          label="Person B Style"
          value={styleB}
          onChange={onStyleBChange}
          customValue={customStyleB}
          onCustomChange={onCustomStyleBChange}
        />
      </div>
    </div>
  );
}

function StylePicker({ label, value, onChange, customValue, onCustomChange }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {PARTNER_STYLES.map((s) => (
          <button
            key={s.id}
            onClick={() => onChange(s.id)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all border ${
              value === s.id
                ? 'bg-primary/20 text-primary border-primary/40'
                : 'bg-secondary text-muted-foreground border-border hover:border-primary/30'
            }`}
          >
            <span>{s.emoji}</span> {s.label}
          </button>
        ))}
      </div>
      {value === 'custom' && (
        <motion.input
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          type="text"
          value={customValue}
          onChange={(e) => onCustomChange(e.target.value)}
          placeholder="e.g. a fierce gladiator…"
          className="mt-2 w-full rounded-lg bg-secondary border border-border text-foreground text-xs placeholder:text-muted-foreground px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      )}
    </div>
  );
}