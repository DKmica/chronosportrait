import React, { useState } from 'react';
import { Globe, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function ShareToCommunityButton({ transformation }) {
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [posted, setPosted] = useState(false);

  const handlePost = async () => {
    setIsPosting(true);
    await base44.functions.invoke('createCommunityPost', {
      transformation_id: transformation.id,
      caption: caption.trim(),
      author_name: authorName.trim() || 'Anonymous',
    });
    setIsPosting(false);
    setPosted(true);
    setTimeout(() => setOpen(false), 1200);
  };

  return (
    <>
      <Button
        variant="outline"
        className="w-full h-12 rounded-xl gap-2 border-border"
        onClick={() => setOpen(true)}
      >
        <Globe className="w-4 h-4" />
        Share to Community
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Share to Community</DialogTitle>
          </DialogHeader>

          {posted ? (
            <div className="flex flex-col items-center gap-2 py-6">
              <span className="text-3xl">🎉</span>
              <p className="font-medium text-foreground">Posted!</p>
              <p className="text-sm text-muted-foreground">Your portrait is now in the community gallery.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div className="w-full aspect-square rounded-xl overflow-hidden bg-muted">
                <img src={transformation.transformed_photo_url} alt="Preview" className="w-full h-full object-cover" />
              </div>

              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Your name (optional)"
                className="w-full rounded-xl bg-secondary/60 border border-border text-foreground text-sm placeholder:text-muted-foreground px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />

              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption… (optional)"
                rows={2}
                className="w-full rounded-xl bg-secondary/60 border border-border text-foreground text-sm placeholder:text-muted-foreground px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              />

              <Button
                onClick={handlePost}
                disabled={isPosting}
                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              >
                {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                {isPosting ? 'Posting…' : 'Post to Gallery'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}