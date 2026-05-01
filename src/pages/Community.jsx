import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Users, Flame, Clock } from 'lucide-react';
import CommunityPostCard from '@/components/community/CommunityPostCard';

const SORTS = [
  { id: 'latest', label: 'Latest', icon: Clock },
  { id: 'top', label: 'Top', icon: Flame },
];

export default function Community() {
  const [sort, setSort] = useState('latest');
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['community-posts'],
    queryFn: () => base44.entities.CommunityPost.list('-created_date', 100),
  });

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const currentUserEmail = me?.email || null;

  const sorted = [...posts].sort((a, b) => {
    if (sort === 'top') return (b.likes_count || 0) - (a.likes_count || 0);
    return new Date(b.created_date) - new Date(a.created_date);
  });

  const handleLikeToggle = async (post, hasLiked) => {
    const likedBy = post.liked_by || [];
    const newLikedBy = hasLiked
      ? likedBy.filter((e) => e !== currentUserEmail)
      : [...likedBy, currentUserEmail];
    const newCount = newLikedBy.length;

    // Optimistic update
    queryClient.setQueryData(['community-posts'], (old) =>
      (old || []).map((p) =>
        p.id === post.id ? { ...p, liked_by: newLikedBy, likes_count: newCount } : p
      )
    );

    await base44.entities.CommunityPost.update(post.id, {
      liked_by: newLikedBy,
      likes_count: newCount,
    });
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-5 h-5 text-primary" />
          <h1 className="font-display text-xl font-bold text-foreground">Community</h1>
        </div>
        <p className="text-muted-foreground text-xs ml-7">Portraits shared by time travelers</p>
      </div>

      {/* Sort tabs */}
      <div className="px-5 mb-4">
        <div className="flex gap-2 p-1 rounded-xl bg-muted/50 w-fit">
          {SORTS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSort(id)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                sort === id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
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
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-5 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-display text-lg text-foreground mb-1">No posts yet</h3>
          <p className="text-muted-foreground text-sm">
            Be the first to share a portrait from your Result page!
          </p>
        </div>
      ) : (
        <div className="px-5 grid grid-cols-1 gap-4 pb-6">
          {sorted.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <CommunityPostCard
                post={post}
                currentUserEmail={currentUserEmail}
                onLikeToggle={handleLikeToggle}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}