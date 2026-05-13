import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Copy, Check, Share2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const REFERRAL_BONUS_REFERRER = 2;
const REFERRAL_BONUS_NEW_USER = 1;

export default function ReferAndEarn({ profile }) {
  const [copied, setCopied] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemStatus, setRedeemStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [redeemMessage, setRedeemMessage] = useState('');

  if (!profile) return null;

  const referralLink = `${window.location.origin}?ref=${profile.referral_code}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    const text = `✨ I've been time-traveling with Chronos Booth! Use my link to get a free extra generation when you sign up: ${referralLink}`;
    if (navigator.share) {
      await navigator.share({ title: 'Join me on Chronos Booth', text, url: referralLink });
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return;
    setRedeemStatus('loading');
    try {
      await base44.functions.invoke('redeemReferral', { referral_code: redeemCode.trim().toUpperCase() });
      setRedeemStatus('success');
      setRedeemMessage(`+${REFERRAL_BONUS_NEW_USER} free generation added to your account!`);
    } catch (err) {
      setRedeemStatus('error');
      const msg = err?.response?.data?.error || err?.message || 'Something went wrong';
      setRedeemMessage(msg === 'Referral code already redeemed' ? "You've already used a referral code." : msg === 'Invalid referral code' ? "That code doesn't exist. Double-check and try again." : msg);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-accent/10 overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <Gift className="w-4 h-4 text-primary" />
          <h3 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider">Refer &amp; Earn</h3>
        </div>
        <p className="text-sm text-muted-foreground">
         Share your link — you get <span className="text-primary font-semibold">+{REFERRAL_BONUS_REFERRER} free generations</span> per friend who joins, they get <span className="text-primary font-semibold">+{REFERRAL_BONUS_NEW_USER}</span>.
        </p>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Stats row */}
        <div className="flex items-center gap-3 rounded-xl bg-muted/40 border border-border px-4 py-3">
          <Users className="w-4 h-4 text-primary flex-shrink-0" />
          <div>
            <p className="text-sm text-muted-foreground">Referral code</p>
            <p className="font-mono font-bold text-foreground tracking-widest text-sm">{profile.referral_code}</p>
          </div>
          {profile.bonus_transformations > 0 && (
            <div className="ml-auto text-right">
              <p className="text-sm text-muted-foreground">Bonus credits</p>
              <p className="font-bold text-primary text-sm">+{profile.bonus_transformations}</p>
            </div>
          )}
        </div>

        {/* Share your link */}
        <div>
          <p className="text-sm text-muted-foreground font-medium mb-2">Your referral link</p>
          <div className="flex gap-2">
            <div className="flex-1 rounded-xl bg-secondary/60 border border-border px-3 py-2.5 text-sm text-muted-foreground truncate">
              {referralLink}
            </div>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-primary/15 border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/25 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <Button
          onClick={handleNativeShare}
          className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-2 text-sm font-semibold"
        >
          <Share2 className="w-4 h-4" />
          Share My Referral Link
        </Button>

        {/* Redeem a friend's code */}
        {!profile.referred_by && (
          <div className="pt-1 border-t border-border">
            <p className="text-sm text-muted-foreground font-medium mb-2">Have a friend's code? Redeem it for a free generation</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={redeemCode}
                onChange={(e) => { setRedeemCode(e.target.value.toUpperCase()); setRedeemStatus(null); }}
                placeholder="ENTER CODE"
                maxLength={12}
                className="flex-1 rounded-xl bg-secondary/60 border border-border px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 uppercase"
              />
              <Button
                onClick={handleRedeem}
                disabled={!redeemCode.trim() || redeemStatus === 'loading' || redeemStatus === 'success'}
                size="sm"
                className="rounded-xl px-4 h-10"
              >
                {redeemStatus === 'loading' ? '…' : 'Redeem'}
              </Button>
            </div>
            {redeemStatus === 'success' && (
              <p className="text-sm text-green-400 mt-2 flex items-center gap-1">
                <Check className="w-3 h-3" /> {redeemMessage}
              </p>
            )}
            {redeemStatus === 'error' && (
              <p className="text-sm text-destructive mt-2">{redeemMessage}</p>
            )}
            </div>
            )}
            {profile.referred_by && (
            <p className="text-sm text-muted-foreground pt-1 border-t border-border">
            ✓ You joined via referral code <span className="font-mono">{profile.referred_by}</span>
          </p>
        )}
      </div>
    </motion.div>
  );
}