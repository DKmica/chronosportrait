import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Issues a one-time reward token for a rewarded ad session.
 * The token is passed as `custom_data` to the AdMob SDK's
 * serverSideVerificationOptions. When the user earns the reward,
 * AdMob sends a Server-Side Verification (SSV) callback to
 * admobSsvCallback, which cryptographically verifies the callback
 * and marks this token as "verified". Only then can
 * grantBonusTransformation consume it.
 *
 * All RewardToken operations are service-role only (RLS = admin),
 * so users cannot self-create or self-verify tokens.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const token = crypto.randomUUID() + '-' + Date.now();

    await base44.asServiceRole.entities.RewardToken.create({
      user_email: user.email,
      token,
      status: 'pending',
    });

    return Response.json({ token });
  } catch (error) {
    console.error('[createRewardSession] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});