import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, Users, Settings, Zap, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTabNavigation } from '@/lib/NavigationContext';

const navItems = [
  { path: '/', icon: Sparkles, label: 'Transform' },
  { path: '/find-timeline', icon: Zap, label: 'My Era' },
  { path: '/my-collection', icon: Package, label: 'Collection' },
  { path: '/community', icon: Users, label: 'Community' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectTab } = useTabNavigation();

  const handleTabClick = (path) => {
    const isActive = location.pathname === path;
    selectTab(path);
    // If already on this tab, reset to root path (clears sub-navigation history)
    navigate(path, { replace: isActive });
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border">
      <div className="flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => handleTabClick(path)}
              className="flex flex-col items-center gap-1 px-4 py-1 relative transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-2 w-8 h-0.5 bg-primary rounded-full"
                />
              )}
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
              <span
                className={`text-xs font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}