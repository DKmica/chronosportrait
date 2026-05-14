import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SpotlightSection() {
  const navigate = useNavigate();

  const { data: posts = [] } = useQuery({
    queryKey: ['spotlight-posts'],
    queryFn: () => base44.entities.CommunityPost.list('-likes_count', 6),
    staleTime: 60_000,
  });

  if (posts.length === 0) return null;

  return (
    <div className="px-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Community Spotlight</p>
        </div>
        <button
          onClick={() => navigate('/community')}
          className="text-xs text-primary font-semibold"
        >
          See all →
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {posts.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => navigate('/community')}
            className="flex-shrink-0 w-32 cursor-pointer group"
          >
            <div className="relative w-32 h-32 rounded-2xl overflow-hidden bg-muted border border-border">
              <img
                src={post.image_url}
                alt={post.era_label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-white text-[10px] font-semibold leading-tight truncate">{post.era_label}</p>
              </div>
              {post.likes_count > 0 && (
                <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/50 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                  <Heart className="w-2.5 h-2.5 text-red-400 fill-red-400" />
                  <span className="text-white text-[10px] font-bold">{post.likes_count}</span>
                </div>
              )}
            </div>
            {post.author_name && (
              <p className="text-[10px] text-muted-foreground mt-1 truncate text-center">{post.author_name}</p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}