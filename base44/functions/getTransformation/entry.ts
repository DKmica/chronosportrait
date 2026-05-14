import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return Response.json({ error: 'Missing transformation id' }, { status: 400 });
    }

    const results = await base44.entities.Transformation.filter({ id });
    const transformation = results[0] || null;

    if (!transformation) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    return Response.json({ transformation });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});