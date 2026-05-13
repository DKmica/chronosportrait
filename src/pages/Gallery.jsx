import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Images, Clock, Users, Package } from 'lucide-react';

const TABS = [
  { id: 'all', label: 'All', icon: Images },
  { id: 'recent', label: 'Recent', icon: Clock },
  { id: 'partners', label: 'Partners', icon: Users },
  { id: 'packs', label: 'Packs', icon: Package },
];

export default function Gallery() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');

  const { data: transformations = [], isLoading } = useQuery({
    queryKey: ['transformations'],
    queryFn: () => base44.entities.Transformation.list('-created_date', 100),
  });

  const completed = transformations.filter(t => t.status === 'completed' && t.transformed_photo_url);

  const filtered = (() => {
    if (tab === 'recent') return completed.slice(0, 10);
    if (tab === 'partners') return completed.filter(t => t.extra_photo_urls?.length > 0);
    if (tab === 'packs') return completed.filter(t => t.pack_id);
    return completed;
  })();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Images className="w-5 h-5 text-primary" />
          <h1 className="font-display text-xl font-bold text-foreground">Gallery</h1>
        </div>
        <p className="text-muted-foreground text-xs ml-7">{completed.length} portrait{completed.length !== 1 ? 's' : ''} created</p>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-4">
        <div className="flex gap-1 p-1 rounded-xl bg-muted/50">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tab === id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-5 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Images className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-display text-lg text-foreground mb-1">No portraits yet</h3>
          <p className="text-muted-foreground text-sm">
            {tab === 'partners' ? 'No Partners portraits found.' : tab === 'packs' ? 'No Era Packs created yet.' : 'Create your first transformation!'}
          </p>
        </div>
      ) : (
        <div className="px-5 grid grid-cols-2 gap-3 pb-6">
          {filtered.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => navigate(`/result/${t.id}`)}
              className="relative aspect-square rounded-2xl overflow-hidden bg-muted cursor-pointer group"
            >
              <img
                src={t.transformed_photo_url}
                alt={t.era_label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-white text-[11px] font-semibold leading-tight truncate">{t.era_label}</p>
                {t.extra_photo_urls?.length > 0 && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <Users className="w-2.5 h-2.5 text-white/60" />
                    <span className="text-[9px] text-white/60">Partners</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}