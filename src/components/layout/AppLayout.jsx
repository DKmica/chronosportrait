import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import BottomNav from './BottomNav';
import { useTabNavigation } from '@/lib/NavigationContext';
import { APP_NAME } from '@/lib/appConfig';

const TAB_ROOTS = ['/', '/find-timeline', '/community', '/settings'];

function getTabIndex(path) {
  const root = TAB_ROOTS.find(t => t === path || (t !== '/' && path.startsWith(t)));
  return TAB_ROOTS.indexOf(root ?? '/');
}

function isRootRoute(path) {
  return TAB_ROOTS.includes(path);
}

// Map tab roots to display titles for child routes
const ROUTE_TITLES = {
  '/result': null, // Result page uses era label — no static title needed
  '/era-pack': 'Era Packs',
  '/legal': 'Legal',
  '/privacy': 'Privacy Policy',
  '/support': 'Help & Support',
  '/delete-account': 'Delete Account',
};

function getRouteTitle(path) {
  for (const [prefix, title] of Object.entries(ROUTE_TITLES)) {
    if (path.startsWith(prefix)) return title;
  }
  return null;
}

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { prevTab, pushToTabHistory } = useTabNavigation();

  const currentIdx = getTabIndex(location.pathname);
  const prevIdx = getTabIndex(prevTab || '/');
  const direction = currentIdx >= prevIdx ? 1 : -1;
  const isRoot = isRootRoute(location.pathname);
  const routeTitle = getRouteTitle(location.pathname);

  // Track navigation history per tab
  useEffect(() => {
    pushToTabHistory(location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Shared top header */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center px-4 h-[max(3rem,env(safe-area-inset-top,0px)+3rem)] pt-[env(safe-area-inset-top,0px)]">
          {isRoot ? (
            // Root tab: show logo
            <h1 className="font-display text-xl font-bold text-foreground">{APP_NAME}</h1>
          ) : (
            // Child route: show back button + title
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(-1)}
                className="p-2 -ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
              {routeTitle && (
                <h1 className="font-display text-lg font-semibold text-foreground">{routeTitle}</h1>
              )}
            </div>
          )}
        </div>
      </header>

      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.main
          key={location.pathname}
          custom={direction}
          initial={{ x: `${direction * 100}%`, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: `${direction * -100}%`, opacity: 0 }}
          transition={{ type: 'tween', duration: 0.22, ease: 'easeInOut' }}
          className="pb-20 min-h-[calc(100vh-3rem)] will-change-transform"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <BottomNav />
    </div>
  );
}