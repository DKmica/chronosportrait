import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = user.id;

    // Delete all user-generated content via service role.
    // UserProfile is intentionally NOT deleted — preserving it keeps usage
    // limits, streak data, and referral history intact, preventing limit
    // reset abuse via account deletion + re-login.
    const [transformations, loras, posts, comments] = await Promise.all([
      base44.asServiceRole.entities.Transformation.filter({ created_by_id: userId }),
      base44.asServiceRole.entities.StyleLora.filter({ created_by_id: userId }),
      base44.asServiceRole.entities.CommunityPost.filter({ created_by_id: userId }),
      base44.asServiceRole.entities.PostComment.filter({ created_by_id: userId }),
    ]);

    await Promise.all([
      ...transformations.map(t => base44.asServiceRole.entities.Transformation.delete(t.id)),
      ...loras.map(l => base44.asServiceRole.entities.StyleLora.delete(l.id)),
      ...posts.map(p => base44.asServiceRole.entities.CommunityPost.delete(p.id)),
      ...comments.map(c => base44.asServiceRole.entities.PostComment.delete(c.id)),
    ]);

    // UserProfile is intentionally left untouched — keeping it findable by email
    // ensures usage limits, streak data, and referral history persist, preventing
    // limit-reset abuse via delete-and-relogin.

    return Response.json({ success: true });
  } catch (error) {
    console.error('[deleteAccount] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});