import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Crown, LogOut, ChevronRight, Sparkles, Shield, Star, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import ReferAndEarn from '@/components/referral/ReferAndEarn';
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

const PLAN_LABELS = {
  free: { label: 'Free', color: 'text-muted-foreground', bg: 'bg-muted/50' },
  pro_monthly: { label: 'Pro Monthly', color: 'text-primary', bg: 'bg-primary/15' },
  pro_yearly: { label: 'Pro Yearly', color: 'text-primary', bg: 'bg-primary/15' },
};

export default function Settings() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [upgrading, setUpgrading] = useState(false);
  const [selectedBillingPlan, setSelectedBillingPlan] = useState('pro_monthly');

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
  const plan = profile?.plan || 'free';
  const planInfo = PLAN_LABELS[plan];

  const handleLogin = () => base44.auth.redirectToLogin(window.location.href);
  const handleLogout = () => base44.auth.logout(window.location.href);

  const handleUpgrade = async (plan = selectedBillingPlan) => {
    // Block checkout from within an iframe (must be from published app)
    if (window.self !== window.top) {
      alert('Checkout is only available from the published app. Please open the app directly.');
      return;
    }
    setUpgrading(true);
    try {
      const res = await base44.functions.invoke('createCheckoutSession', {
        success_url: `${window.location.origin}/settings?upgraded=true`,
        cancel_url: `${window.location.origin}/settings`,
        plan,
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error('Upgrade error:', err);
    } finally {
      setUpgrading(false);
    }
  };
  
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
      {/* Header */}
      <div className="px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
        <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
      </div>

      {/* Not signed in */}
      {!isAuthenticated ? (
        <div className="px-5 mt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card p-8 flex flex-col items-center text-center gap-4"
          >
            <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">Sign in to Chronos Booth</h2>
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
              <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${planInfo.bg} ${planInfo.color}`}>
                {planInfo.label}
              </span>
            </div>
          </motion.div>

          {/* Usage Stats */}
          {profile && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Usage</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground font-display">{profile.total_transformations || 0}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Total</p>
                  </div>
                  <div className="text-center border-x border-border">
                  <p className="text-2xl font-bold text-foreground font-display">{profile.transformations_today || 0}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Today</p>
                  </div>
                  <div className="text-center">
                  <p className="text-2xl font-bold text-primary font-display">🔥 {profile.streak_days || 0}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Day Streak</p>
                </div>
              </div>
              {profile.bonus_transformations > 0 && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm">
                  <Star className="w-4 h-4 flex-shrink-0" />
                  <span>{profile.bonus_transformations} bonus transformation{profile.bonus_transformations !== 1 ? 's' : ''} from referrals</span>
                </div>
              )}
            </motion.div>
          )}

          {/* Subscription */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-border bg-card overflow-hidden"
          >
            <div className="p-5 border-b border-border">
              <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">Subscription</h3>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{planInfo.label} Plan</p>
                    <p className="text-xs text-muted-foreground">
                      {plan === 'free' ? '3 transformations/day' : 'Unlimited transformations'}
                    </p>
                  </div>
                </div>
              </div>
              {plan === 'free' && (
                <div className="space-y-3">
                  <div className="rounded-xl bg-muted/40 border border-border p-3 space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Free Tier includes</p>
                    {[
                      '3 single transformations/day',
                      'Earn bonus generations by sharing portraits',
                      'Earn bonus via referral link',
                      'Unlock Couples & Group modes by watching an ad',
                    ].map(f => (
                      <p key={f} className="text-xs text-foreground flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">✓</span> {f}
                      </p>
                    ))}
                  </div>
                  <div className="rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 p-4">
                    <p className="font-semibold text-foreground text-sm mb-1">Upgrade to Pro</p>
                    <ul className="space-y-1 mb-3">
                      {['Unlimited transformations', 'Couples & Group modes always unlocked', 'Priority AI processing', 'HD cinematic videos'].map(f => (
                        <li key={f} className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <span className="text-primary">✓</span> {f}
                        </li>
                      ))}
                    </ul>
                    {/* Billing toggle */}
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => setSelectedBillingPlan('pro_monthly')}
                        className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition-colors ${selectedBillingPlan === 'pro_monthly' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                      >
                        Monthly<br /><span className="font-bold text-sm">$7.99</span>
                      </button>
                      <button
                        onClick={() => setSelectedBillingPlan('pro_yearly')}
                        className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition-colors relative ${selectedBillingPlan === 'pro_yearly' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                      >
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">Save 58%</span>
                        Yearly<br /><span className="font-bold text-sm">$39.99</span>
                      </button>
                    </div>
                    <Button
                      onClick={() => handleUpgrade(selectedBillingPlan)}
                      disabled={upgrading}
                      className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-2 text-sm font-semibold disabled:opacity-60"
                    >
                      <Crown className="w-4 h-4" />
                      {upgrading ? 'Redirecting...' : `Upgrade to Pro — ${selectedBillingPlan === 'pro_yearly' ? '$39.99/yr' : '$7.99/mo'}`}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Refer & Earn */}
          {profile && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <ReferAndEarn profile={profile} />
            </motion.div>
          )}

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
              { icon: Shield, label: 'Privacy & Terms', action: () => navigate('/legal') },
              { icon: Star, label: 'Rate the App', action: () => {} },
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

          <p className="text-center text-sm text-muted-foreground">Chronos Booth v1.0</p>
        </div>
      )}
    </div>
  );
}