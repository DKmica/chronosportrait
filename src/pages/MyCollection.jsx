import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Trash2, Download, Share2, Calendar, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function MyCollection() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: transformations = [], isLoading } = useQuery({
    queryKey: ['myTransformations', user?.email],
    queryFn: () => base44.entities.Transformation.filter({}, '-created_date', 100),
    enabled: !!user?.email,
  });

  const completed = transformations.filter(t => t.status === 'completed' && t.transformed_photo_url);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await base44.entities.Transformation.delete(id);
      queryClient.invalidateQueries({ queryKey: ['myTransformations'] });
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = (url) => {
    window.open(url, '_blank');
  };

  const handleShare = (id) => {
    navigate(`/result/${id}`);
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Package className="w-5 h-5 text-primary" />
          <h1 className="font-display text-2xl font-bold text-foreground">My Collection</h1>
        </div>
        <p className="text-muted-foreground text-sm ml-7">{completed.length} transformation{completed.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : completed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-5 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-display text-lg text-foreground mb-1">No transformations yet</h3>
          <p className="text-muted-foreground text-sm mb-6">Start creating transformations to build your collection!</p>
          <Button
            onClick={() => navigate('/')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            Create Your First
          </Button>
        </div>
      ) : (
        <div className="px-5 space-y-3">
          {completed.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-card overflow-hidden"
            >
              <div className="flex gap-3 p-3">
                {/* Thumbnail */}
                <div
                  onClick={() => handleShare(t.id)}
                  className="w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <img
                    src={t.transformed_photo_url}
                    alt={t.era_label}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{t.era_label}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(t.created_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: t.created_date.split('-')[0] !== new Date().getFullYear().toString() ? 'numeric' : undefined,
                    })}
                  </div>
                  {t.extra_photo_urls?.length > 0 && (
                    <p className="text-sm text-primary font-medium mt-0.5">Partners Mode</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1 justify-center">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => handleDownload(t.transformed_photo_url)}
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => handleShare(t.id)}
                    title="Share"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Transformation</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this {t.era_label} transformation. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleDelete(t.id)}
                          disabled={deleting === t.id}
                        >
                          {deleting === t.id ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}