import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, LogOut, ChevronRight, Sparkles, Shield, Star, Trash2, HelpCircle, UserX } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
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

export default function Settings() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile', user?.email],
    queryFn: () => base44.entities.UserProfile.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  useEffect(() => {
    base44.auth.isAuthenticated().then(setIsAuthenticated);
  }, []);

  const profile = profiles[0];

  const handleLogin = () => base44.auth.redirectToLogin(window.location.href);
  const handleLogout = () => base44.auth.logout(window.location.href);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      // Delete user profile data
      if (profile?.id) {
        await base44.entities.UserProfile.delete(profile.id);
      }
      // Logout user
      base44.auth.logout(window.location.href);
    } catch (error) {
      console.error('Delete account error:', error);
      setDeleteError('Failed to delete account. Please try again.');
      setDeleting(false);
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Not signed in */}
      {!isAuthenticated ? (
        <div className="px-5 mt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card p-8 flex flex-col items-center text-center gap-4"
          >
            <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">Sign in to ChronosBooth</h2>
              <p className="text-muted-foreground text-sm mt-1">Save your transformations, track your history, and unlock Pro features.</p>
            </div>
            <Button
              onClick={handleLogin}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-semibold"
            >
              <Sparkles className="w-4 h-4" />
              Sign In
            </Button>
          </motion.div>
        </div>
      ) : (
        <div className="px-5 space-y-5 pb-8">

          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground font-display text-xl font-bold">
                {user?.full_name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">{user?.full_name || 'Anonymous'}</p>
              <p className="text-muted-foreground text-sm truncate">{user?.email}</p>

            </div>
          </motion.div>

          {/* App Info */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-border bg-card overflow-hidden"
          >
            <div className="p-5 border-b border-border">
              <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">About</h3>
            </div>
            {[
              { icon: Shield, label: 'Privacy Policy', action: () => navigate('/privacy') },
              { icon: Shield, label: 'Terms of Service', action: () => navigate('/legal') },
              { icon: HelpCircle, label: 'Help & Support', action: () => navigate('/support') },
              { icon: Star, label: 'Rate the App', action: () => window.open('https://play.google.com/store/apps/details?id=com.chronosbooth.app', '_blank') },
              { icon: UserX, label: 'Delete My Account', action: () => navigate('/delete-account') },
            ].map(({ icon: Icon, label, action }) => (
              <button
                key={label}
                onClick={action}
                className="w-full flex items-center gap-3 px-5 py-4 border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
              >
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1 text-sm text-foreground text-left">{label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </motion.div>

          {/* Sign Out */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full h-12 rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </motion.div>

          {/* Delete Account */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full h-12 rounded-xl text-destructive hover:bg-destructive/10 gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
               <AlertDialogHeader>
                 <AlertDialogTitle>Delete Account?</AlertDialogTitle>
                 <AlertDialogDescription className="space-y-2">
                   <p>This action <strong>cannot be undone</strong>.</p>
                   <p>We will permanently delete:</p>
                   <ul className="list-disc list-inside text-xs space-y-1 ml-2">
                     <li>Your account and profile</li>
                     <li>All transformations and saved images</li>
                     <li>Your referral code and bonuses</li>
                   </ul>
                 </AlertDialogDescription>
               </AlertDialogHeader>
               {deleteError && (
                 <div className="px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                   {deleteError}
                 </div>
               )}
               <AlertDialogFooter>
                 <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                 <AlertDialogAction
                   className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                   onClick={handleDeleteAccount}
                   disabled={deleting}
                 >
                   {deleting ? 'Deleting...' : 'Delete My Account'}
                 </AlertDialogAction>
               </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </motion.div>

          <p className="text-center text-sm text-muted-foreground">ChronosBooth v1.0.0 (1)</p>
        </div>
      )}
    </div>
  );
}