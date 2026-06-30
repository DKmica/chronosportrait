import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { post_id } = await req.json();
    if (!post_id || typeof post_id !== 'string') {
      return Response.json({ error: 'post_id is required' }, { status: 400 });
    }

    const posts = await base44.asServiceRole.entities.CommunityPost.filter({ id: post_id });
    const post = posts?.[0];
    if (!post) return Response.json({ error: 'Post not found' }, { status: 404 });

    const likedBy = Array.isArray(post.liked_by) ? post.liked_by : [];
    const hasLiked = likedBy.includes(user.email);
    const newLikedBy = hasLiked
      ? likedBy.filter(e => e !== user.email)
      : [...likedBy, user.email];

    await base44.asServiceRole.entities.CommunityPost.update(post_id, {
      liked_by: newLikedBy,
      likes_count: newLikedBy.length,
    });

    return Response.json({
      liked_by: newLikedBy,
      likes_count: newLikedBy.length,
      hasLiked: !hasLiked,
    });
  } catch (error) {
    console.error('togglePostLike error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});