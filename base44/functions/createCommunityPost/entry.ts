import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body = {};
    try { const text = await req.text(); if (text) body = JSON.parse(text); } catch (_) {}
    const { transformation_id, caption = '', author_name = '' } = body;

    if (!transformation_id) {
      return Response.json({ error: 'transformation_id is required' }, { status: 400 });
    }

    // Fetch the transformation and verify ownership before populating fields.
    const transformations = await base44.asServiceRole.entities.Transformation.filter(
      { id: transformation_id }
    );
    const transformation = transformations?.[0];
    if (!transformation) {
      return Response.json({ error: 'Transformation not found' }, { status: 404 });
    }
    if (transformation.created_by_id !== user.id) {
      return Response.json({ error: 'Forbidden: you do not own this transformation' }, { status: 403 });
    }

    const post = await base44.asServiceRole.entities.CommunityPost.create({
      transformation_id,
      image_url: transformation.transformed_photo_url,
      era_label: transformation.era_label,
      caption: String(caption).trim(),
      author_name: String(author_name).trim() || 'Anonymous',
      likes_count: 0,
      liked_by: [],
    });

    return Response.json({ success: true, post });
  } catch (error) {
    console.error('[createCommunityPost] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});