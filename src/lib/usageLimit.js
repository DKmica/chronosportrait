import { base44 } from '@/api/base44Client';

export const FREE_DAILY_LIMIT = 3;

export async function getUserProfile(userEmail) {
  const profiles = await base44.entities.UserProfile.filter({ user_email: userEmail }, '-updated_date');
  return profiles[0] || null;
}

function generateReferralCode(email) {
  const prefix = email.split('@')[0].replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 5);
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${suffix}`;
}

export async function getOrCreateProfile(userEmail) {
  let profile = await getUserProfile(userEmail);
  if (!profile) {
    profile = await base44.entities.UserProfile.create({
      user_email: userEmail,
      plan: 'free',
      transformations_today: 0,
      bonus_transformations: 0,
      total_transformations: 0,
      streak_days: 0,
      referral_code: generateReferralCode(userEmail),
    });
  } else if (!profile.referral_code) {
    // Backfill for existing profiles without a code
    await base44.entities.UserProfile.update(profile.id, {
      referral_code: generateReferralCode(userEmail),
    });
    profile = await getUserProfile(userEmail);
  }
  return profile;
}

export function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

export function getRemainingToday(profile) {
  if (!profile) return FREE_DAILY_LIMIT;
  if (profile.plan !== 'free') return Infinity;
  const today = getTodayString();
  const usedToday = profile.last_transform_date === today ? (profile.transformations_today || 0) : 0;
  const base = FREE_DAILY_LIMIT - usedToday;
  const bonus = profile.bonus_transformations || 0;
  const credits = profile.credits || 0;
  return Math.max(0, base + bonus + credits);
}

export async function consumeTransformation(profile) {
  const today = getTodayString();
  const isNewDay = profile.last_transform_date !== today;
  const usedToday = isNewDay ? 0 : (profile.transformations_today || 0);

  // Consume bonus first if we're over the free limit
  const overBase = usedToday >= FREE_DAILY_LIMIT;
  const bonusLeft = profile.bonus_transformations || 0;

  // Update streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const lastStreak = profile.last_streak_date;
  const currentStreak = profile.streak_days || 0;

  let newStreak = currentStreak;
  if (lastStreak !== today) {
    // continuing streak from yesterday, or starting fresh
    newStreak = (lastStreak === yesterdayStr || lastStreak === profile.streak_freeze_used_date)
      ? currentStreak + 1
      : 1;
  }

  // Append today to streak_history (deduplicated)
  const history = profile.streak_history || [];
  const newHistory = history.includes(today) ? history : [...history, today].slice(-90); // keep last 90 days

  await base44.entities.UserProfile.update(profile.id, {
    transformations_today: isNewDay ? 1 : usedToday + 1,
    last_transform_date: today,
    total_transformations: (profile.total_transformations || 0) + 1,
    bonus_transformations: overBase && bonusLeft > 0 ? bonusLeft - 1 : bonusLeft,
    streak_days: newStreak,
    last_streak_date: today,
    streak_history: newHistory,
    challenge_completed_date: today,
  });
}

export async function addBonusTransformation(profile, amount = 1) {
  await base44.entities.UserProfile.update(profile.id, {
    bonus_transformations: (profile.bonus_transformations || 0) + amount,
  });
}