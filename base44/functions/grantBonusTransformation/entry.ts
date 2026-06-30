import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const MAX_REWARDED_PER_DAY = 3;
const BONUS_PER_AD = 1;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body = {};
    try { const text = await req.text(); if (text) body = JSON.parse(text); } catch (_) {}
    const { amount = BONUS_PER_AD, source = 'rewarded_ad' } = body;

    const profiles = await base44.asServiceRole.entities.UserProfile.filter(
      { user_email: user.email }, '-updated_date'
    );
    const profile = profiles?.[0];
    if (!profile) return Response.json({ error: 'Profile not found' }, { status: 404 });

    const isPro = profile.plan === 'pro_monthly' || profile.plan === 'pro_yearly';
    if (isPro) return Response.json({ error: 'Pro users do not need bonus transformations' }, { status: 400 });

    const today = new Date().toISOString().split('T')[0];
    const isNewDay = profile.last_rewarded_ad_date !== today;
    const watchedToday = isNewDay ? 0 : (profile.rewarded_ads_watched_today || 0);

    if (source === 'rewarded_ad') {
      if (watchedToday >= MAX_REWARDED_PER_DAY) {
        return Response.json({ error: 'Daily rewarded ad limit reached' }, { status: 429 });
      }
      const update = {
        bonus_transformations: (profile.bonus_transformations || 0) + amount,
        rewarded_ads_watched_today: isNewDay ? 1 : watchedToday + 1,
        last_rewarded_ad_date: today,
      };
      await base44.asServiceRole.entities.UserProfile.update(profile.id, update);
      return Response.json({ success: true, bonus_transformations: update.bonus_transformations });
    }

    // Other sources (e.g. referral) — referral bonuses are handled by redeemReferral.
    return Response.json({ error: 'Unsupported bonus source' }, { status: 400 });
  } catch (error) {
    console.error('[grantBonusTransformation] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});