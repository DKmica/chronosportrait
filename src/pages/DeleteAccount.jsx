import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function DeleteAccount() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    if (!confirmed) return;
    setDeleting(true);
    setError(null);
    try {
      // Use secure backend function to purge user data.
      // UserProfile is preserved server-side to prevent limit-reset abuse.
      await base44.functions.invoke('deleteAccount', {});
      setDone(true);
      // Give user a moment to see confirmation, then log out
      setTimeout(() => {
        base44.auth.logout('/');
      }, 3000);
    } catch (err) {
      setError('Something went wrong. Please try again or email us at privacy@chronosbooth.app.');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      <div className="px-5 pt-3 space-y-5">
        {done ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-green-500/30 bg-green-500/10 p-8 flex flex-col items-center text-center gap-4"
          >
            <CheckCircle2 className="w-12 h-12 text-green-400" />
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">Account Deleted</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Your account and all associated data have been permanently deleted. You'll be signed out shortly.
              </p>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Warning card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-destructive/15 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="w-5 h-5 text-destructive" />
                </div>
                <h2 className="font-semibold text-foreground text-base">This cannot be undone</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Deleting your account will permanently remove all of the following:
              </p>
              <ul className="space-y-1.5">
                {[
                  'Your account and profile information',
                  'All transformations and generated portraits',
                  'Your subscription and credits',
                  'Referral code and earned bonuses',
                  'Streak history and daily challenge progress',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-destructive mt-0.5">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Sign-in required */}
            {!user ? (
              <div className="rounded-2xl border border-border bg-card p-6 text-center">
                <p className="text-sm text-muted-foreground mb-4">You must be signed in to delete your account.</p>
                <Button
                  onClick={() => base44.auth.redirectToLogin(window.location.href)}
                  className="rounded-xl bg-primary text-primary-foreground"
                >
                  Sign In
                </Button>
              </div>
            ) : (
              <>
                {/* Account being deleted */}
                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground mb-1">Account to be deleted</p>
                  <p className="text-sm font-semibold text-foreground">{user.full_name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>

                {/* Confirmation checkbox */}
                <button
                  onClick={() => setConfirmed(v => !v)}
                  className="flex items-start gap-3 w-full text-left"
                >
                  <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                    confirmed ? 'bg-destructive border-destructive' : 'border-muted-foreground/40 bg-transparent'
                  }`}>
                    {confirmed && <span className="text-white text-xs font-bold">✓</span>}
                  </div>
                  <span className="text-sm text-muted-foreground leading-relaxed">
                    I understand this action is <strong className="text-foreground">permanent and irreversible</strong>. I want to delete my ChronosBooth account and all my data.
                  </span>
                </button>

                {/* Error message */}
                {error && (
                  <div className="rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                {/* Delete button */}
                <Button
                  onClick={handleDelete}
                  disabled={!confirmed || deleting}
                  className="w-full h-13 rounded-xl bg-destructive hover:bg-destructive/90 text-white gap-2 disabled:opacity-40"
                >
                  {deleting ? (
                    <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Deleting…</>
                  ) : (
                    <><Trash2 className="w-4 h-4" /> Permanently Delete My Account</>
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Changed your mind?{' '}
                  <button onClick={() => navigate(-1)} className="text-primary underline">Go back</button>
                  {' '}or email{' '}
                  <a href="mailto:privacy@chronosbooth.app" className="text-primary underline">privacy@chronosbooth.app</a>
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}