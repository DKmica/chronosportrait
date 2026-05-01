import React, { useState } from 'react';
import { Heart, MessageCircle, ChevronDown, ChevronUp, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function CommunityPostCard({ post, currentUserEmail, onLikeToggle }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const likedBy = post.liked_by || [];
  const hasLiked = currentUserEmail && likedBy.includes(currentUserEmail);

  const handleToggleComments = async () => {
    if (!showComments && comments === null) {
      setLoadingComments(true);
      const data = await base44.entities.PostComment.filter({ post_id: post.id }, '-created_date', 50);
      setComments(data);
      setLoadingComments(false);
    }
    setShowComments((v) => !v);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    const newComment = await base44.entities.PostComment.create({
      post_id: post.id,
      text: commentText.trim(),
      author_name: currentUserEmail ? currentUserEmail.split('@')[0] : 'Anonymous',
      author_email: currentUserEmail || '',
    });
    setComments((prev) => [newComment, ...(prev || [])]);
    setCommentText('');
    setSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl overflow-hidden border border-border"
    >
      {/* Image */}
      <div className="aspect-square w-full relative">
        <img src={post.image_url} alt={post.era_label} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white font-display font-semibold text-sm">{post.era_label}</p>
          <p className="text-white/60 text-[10px]">by {post.author_name || 'Anonymous'}</p>
        </div>
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="px-4 pt-3">
          <p className="text-foreground text-sm leading-relaxed">{post.caption}</p>
        </div>
      )}

      {/* Actions bar */}
      <div className="flex items-center gap-4 px-4 py-3">
        <button
          onClick={() => onLikeToggle(post, hasLiked)}
          className="flex items-center gap-1.5 group"
        >
          <Heart
            className={`w-5 h-5 transition-all ${hasLiked ? 'fill-red-500 text-red-500 scale-110' : 'text-muted-foreground group-hover:text-red-400'}`}
          />
          <span className={`text-sm font-medium ${hasLiked ? 'text-red-500' : 'text-muted-foreground'}`}>
            {post.likes_count || 0}
          </span>
        </button>

        <button onClick={handleToggleComments} className="flex items-center gap-1.5 group">
          <MessageCircle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="text-sm font-medium text-muted-foreground">
            {showComments ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />}
          </span>
        </button>
      </div>

      {/* Comments section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="px-4 py-3 space-y-3 max-h-60 overflow-y-auto">
              {loadingComments && (
                <div className="flex justify-center py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {comments && comments.length === 0 && (
                <p className="text-muted-foreground text-xs text-center py-2">No comments yet. Be the first!</p>
              )}
              {comments && comments.map((c) => (
                <div key={c.id} className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-primary">
                    {(c.author_name || 'A')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{c.author_name || 'Anonymous'}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Comment input */}
            <div className="flex gap-2 px-4 pb-3">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                placeholder="Add a comment…"
                className="flex-1 rounded-xl bg-secondary/60 border border-border text-foreground text-xs placeholder:text-muted-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                onClick={handleSubmitComment}
                disabled={submitting || !commentText.trim()}
                className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center disabled:opacity-40 flex-shrink-0"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-foreground" /> : <Send className="w-3.5 h-3.5 text-primary-foreground" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}