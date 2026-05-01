import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Awards 1 bonus generation to referrer when a new user redeems their code.
// Safe to call multiple times — enforced by checking referred_by already set.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { referral_code } = await req.json();

    if (!referral_code) {
      return Response.json({ error: 'Missing referral_code' }, { status: 400 });
    }

    // Get the current user's profile
    const myProfiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: user.email });
    const myProfile = myProfiles[0];

    if (!myProfile) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Don't allow re-redemption
    if (myProfile.referred_by) {
      return Response.json({ error: 'Referral code already redeemed' }, { status: 409 });
    }

    // Find the referrer by their referral code
    const referrerProfiles = await base44.asServiceRole.entities.UserProfile.filter({ referral_code });
    const referrer = referrerProfiles[0];

    if (!referrer) {
      return Response.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    // Prevent self-referral
    if (referrer.user_email === user.email) {
      return Response.json({ error: 'Cannot use your own referral code' }, { status: 400 });
    }

    // Award +2 bonus generations to the referrer
    await base44.asServiceRole.entities.UserProfile.update(referrer.id, {
      bonus_transformations: (referrer.bonus_transformations || 0) + 2,
    });

    // Award +1 bonus generation to the new user and record the referral
    await base44.asServiceRole.entities.UserProfile.update(myProfile.id, {
      referred_by: referral_code,
      bonus_transformations: (myProfile.bonus_transformations || 0) + 1,
    });

    return Response.json({ success: true, bonus_awarded: 1, referrer_bonus: 2 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});