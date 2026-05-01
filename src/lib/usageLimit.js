import { base44 } from '@/api/base44Client';

export const FREE_DAILY_LIMIT = 3;

export async function getUserProfile(userEmail) {
  const profiles = await base44.entities.UserProfile.filter({ user_email: userEmail });
  return profiles[0] || null;
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
    });
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
  return Math.max(0, base + bonus);
}

export async function consumeTransformation(profile) {
  const today = getTodayString();
  const isNewDay = profile.last_transform_date !== today;
  const usedToday = isNewDay ? 0 : (profile.transformations_today || 0);

  // Consume bonus first if we're over the free limit
  const overBase = usedToday >= FREE_DAILY_LIMIT;
  const bonusLeft = profile.bonus_transformations || 0;

  await base44.entities.UserProfile.update(profile.id, {
    transformations_today: isNewDay ? 1 : usedToday + 1,
    last_transform_date: today,
    total_transformations: (profile.total_transformations || 0) + 1,
    bonus_transformations: overBase && bonusLeft > 0 ? bonusLeft - 1 : bonusLeft,
  });
}

export async function addBonusTransformation(profile, amount = 1) {
  await base44.entities.UserProfile.update(profile.id, {
    bonus_transformations: (profile.bonus_transformations || 0) + amount,
  });
}