import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body = {};
    try { const text = await req.text(); if (text) body = JSON.parse(text); } catch (_) {}
    const { post_id, text } = body;

    if (!post_id) return Response.json({ error: 'post_id is required' }, { status: 400 });
    if (!text || !String(text).trim()) {
      return Response.json({ error: 'Comment text is required' }, { status: 400 });
    }

    // Verify the post exists.
    const posts = await base44.asServiceRole.entities.CommunityPost.filter({ id: post_id });
    if (!posts?.[0]) return Response.json({ error: 'Post not found' }, { status: 404 });

    // Resolve author identity server-side from the authenticated session.
    const userEmail = user.email || '';
    const authorName = userEmail ? userEmail.split('@')[0] : 'Anonymous';

    const comment = await base44.asServiceRole.entities.PostComment.create({
      post_id,
      text: String(text).trim(),
      author_name: authorName,
      author_email: userEmail,
    });

    return Response.json({ success: true, comment });
  } catch (error) {
    console.error('[createPostComment] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});