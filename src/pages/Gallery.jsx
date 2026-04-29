import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Image, Sparkles } from 'lucide-react';

export default function Gallery() {
  const { data: transformations = [], isLoading } = useQuery({
    queryKey: ['transformations'],
    queryFn: () => base44.entities.Transformation.list('-created_date', 50),
  });

  const completed = transformations.filter((t) => t.status === 'completed');

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
        <div className="flex items-center gap-2">
          <Image className="w-5 h-5 text-primary" />
          <h1 className="font-display text-xl font-bold text-foreground">Gallery</h1>
        </div>
        <p className="text-muted-foreground text-xs mt-1 ml-7">
          Your transformations
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : completed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-5 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-display text-lg text-foreground mb-1">No transformations yet</h3>
          <p className="text-muted-foreground text-sm">
            Go to Transform to create your first one!
          </p>
        </div>
      ) : (
        <div className="px-5 grid grid-cols-2 gap-3">
          {completed.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={`/result/${item.id}`}
                className="block relative rounded-xl overflow-hidden aspect-square group"
              >
                <img
                  src={item.transformed_photo_url}
                  alt={item.era_label}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white font-display text-sm font-semibold">
                    {item.era_label}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}