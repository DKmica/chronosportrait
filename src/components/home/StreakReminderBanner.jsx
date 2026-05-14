import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, X, Bell } from 'lucide-react';

function getHoursUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return (midnight - now) / 3600000;
}

export default function StreakReminderBanner({ profile }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!profile || dismissed) return;
    const streak = profile.streak_days || 0;
    if (streak === 0) return;

    const today = new Date().toISOString().split('T')[0];
    const completedToday = profile.challenge_completed_date === today
      || profile.last_transform_date === today;

    if (completedToday) return;

    // Show reminder if < 6 hours left in the day and they have a streak to protect
    const hoursLeft = getHoursUntilMidnight();
    if (hoursLeft < 6) {
      setVisible(true);
    }
  }, [profile, dismissed]);

  // Also request browser notification permission on first load for streaks > 3
  useEffect(() => {
    if (!profile) return;
    const streak = profile.streak_days || 0;
    if (streak >= 3 && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          scheduleStreakNotification(streak);
        }
      });
    }
  }, [profile?.streak_days]);

  if (!visible || dismissed) return null;

  const streak = profile?.streak_days || 0;
  const hoursLeft = Math.ceil(getHoursUntilMidnight());

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        className="mx-5 mb-3 rounded-2xl border border-orange-500/40 bg-orange-500/10 p-3 flex items-center gap-3"
      >
        <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
          <Flame className="w-4 h-4 text-orange-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            🔥 {streak}-day streak at risk!
          </p>
          <p className="text-xs text-muted-foreground">
            {hoursLeft}h left today — complete a transformation to keep it alive.
          </p>
        </div>
        <button onClick={() => setDismissed(true)} className="p-1 -mr-1">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

function scheduleStreakNotification(streak) {
  // Schedule a browser notification at 8pm local time if not already done today
  const now = new Date();
  const reminderTime = new Date(now);
  reminderTime.setHours(20, 0, 0, 0);
  if (reminderTime <= now) return; // already past 8pm

  const delay = reminderTime - now;
  setTimeout(() => {
    new Notification('🔥 Don\'t break your streak!', {
      body: `You have a ${streak}-day streak on ChronosBooth. Complete today's transformation before midnight!`,
      icon: '/favicon.ico',
      tag: 'streak-reminder',
    });
  }, delay);
}