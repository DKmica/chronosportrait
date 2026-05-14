/**
 * OfflineBanner — shows a banner when the device has no internet connection.
 * Handles the offline state requirement for Google Play readiness.
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 px-4 py-2 bg-destructive text-white text-sm font-semibold shadow-lg"
          style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
        >
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          No internet connection — check your network and try again.
        </motion.div>
      )}
    </AnimatePresence>
  );
}