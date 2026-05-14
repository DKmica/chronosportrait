import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import BottomNav from './BottomNav';
import { useTabNavigation } from '@/lib/NavigationContext';

const TAB_ROOTS = ['/', '/find-timeline', '/my-collection', '/community', '/settings'];

function getTabIndex(path) {
  const root = TAB_ROOTS.find(t => t === path || (t !== '/' && path.startsWith(t)));
  return TAB_ROOTS.indexOf(root ?? '/');
}

export default function AppLayout() {
  const location = useLocation();
  const { prevTab } = useTabNavigation();

  const currentIdx = getTabIndex(location.pathname);
  const prevIdx = getTabIndex(prevTab || '/');
  const direction = currentIdx >= prevIdx ? 1 : -1;

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.main
          key={location.pathname}
          custom={direction}
          initial={{ x: `${direction * 100}%`, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: `${direction * -100}%`, opacity: 0 }}
          transition={{ type: 'tween', duration: 0.22, ease: 'easeInOut' }}
          className="pb-20 min-h-screen will-change-transform"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <BottomNav />
    </div>
  );
}