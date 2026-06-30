import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const MAX_REWARDED_PER_DAY = 3;
const BONUS_PER_AD = 1;

/**
 * Grants a bonus transformation ONLY if the provided reward_token has been
 * cryptographically verified by the AdMob SSV callback (admobSsvCallback).
 *
 * Flow:
 *   1. Frontend calls createRewardSession → gets a one-time token.
 *   2. Frontend shows rewarded ad with customData = token.
 *   3. AdMob SSV callback verifies signature → marks token "verified".
 *   4. Frontend calls this function with the token.
 *   5. This function checks token is "verified" + not "consumed" → grants bonus.
 *
 * Without a verified token, no bonus is granted — preventing direct-call bypass.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body = {};
    try { const text = await req.text(); if (text) body = JSON.parse(text); } catch (_) {}
    const { reward_token } = body;

    if (!reward_token) {
      return Response.json({ error: 'reward_token is required' }, { status: 400 });
    }

    // ── Verify the reward token was verified by AdMob SSV ──
    const tokens = await base44.asServiceRole.entities.RewardToken.filter({
      token: reward_token,
      user_email: user.email,
    });
    const tokenRecord = tokens?.[0];

    if (!tokenRecord) {
      return Response.json({ error: 'Invalid reward token', error_code: 'INVALID_TOKEN' }, { status: 403 });
    }
    if (tokenRecord.status === 'pending') {
      return Response.json({
        error: 'Ad completion not yet verified. Please try again in a moment.',
        error_code: 'PENDING_VERIFICATION',
      }, { status: 409 });
    }
    if (tokenRecord.status === 'consumed') {
      return Response.json({ error: 'This reward has already been claimed', error_code: 'TOKEN_CONSUMED' }, { status: 409 });
    }
    if (tokenRecord.status !== 'verified') {
      return Response.json({ error: 'Invalid token status', error_code: 'INVALID_TOKEN' }, { status: 403 });
    }

    // ── Check profile and daily limit ──
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

    if (watchedToday >= MAX_REWARDED_PER_DAY) {
      // Consume token since the ad was genuinely watched.
      await base44.asServiceRole.entities.RewardToken.update(tokenRecord.id, { status: 'consumed' });
      return Response.json({ error: 'Daily rewarded ad limit reached' }, { status: 429 });
    }

    // ── Consume token and grant bonus ──
    await base44.asServiceRole.entities.RewardToken.update(tokenRecord.id, { status: 'consumed' });

    const update = {
      bonus_transformations: (profile.bonus_transformations || 0) + BONUS_PER_AD,
      rewarded_ads_watched_today: isNewDay ? 1 : watchedToday + 1,
      last_rewarded_ad_date: today,
    };
    await base44.asServiceRole.entities.UserProfile.update(profile.id, update);

    return Response.json({ success: true, bonus_transformations: update.bonus_transformations });
  } catch (error) {
    console.error('[grantBonusTransformation] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});