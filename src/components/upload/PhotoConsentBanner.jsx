/**
 * PhotoConsentBanner — shown once above the photo uploader.
 * Google Play requirement: explicit consent copy for photo uploads.
 * Dismissed after first acceptance (stored in localStorage).
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X } from 'lucide-react';

const STORAGE_KEY = 'cb_photo_consent_v1';

export default function PhotoConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(STORAGE_KEY);
    if (!accepted) setVisible(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex gap-3 items-start"
        >
          <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground font-semibold mb-0.5">Photo upload consent</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Photos you upload are used only to generate your AI portrait. We never sell or share
              your images. By uploading you agree to our{' '}
              <a href="/legal" className="text-primary underline">Privacy Policy</a>.
            </p>
          </div>
          <button onClick={handleAccept} className="p-1 -mt-0.5 -mr-1 flex-shrink-0">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}