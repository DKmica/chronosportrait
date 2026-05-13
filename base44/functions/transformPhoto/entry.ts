import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const FAL_KEY = Deno.env.get('FAL_API_KEY');

// Submit a job to fal queue and poll until done (max ~120s)
async function falRun(endpointId, input) {
  const submitRes = await fetch(`https://queue.fal.run/${endpointId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  if (!submitRes.ok) {
    const txt = await submitRes.text();
    throw new Error(`fal submit error (${endpointId}) ${submitRes.status}: ${txt.slice(0, 300)}`);
  }
  const { request_id } = await submitRes.json();
  console.log(`fal [${endpointId}] request_id:`, request_id);

  const statusUrl = `https://queue.fal.run/${endpointId}/requests/${request_id}/status`;
  const resultUrl = `https://queue.fal.run/${endpointId}/requests/${request_id}`;

  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const statusRes = await fetch(statusUrl, {
      headers: { 'Authorization': `Key ${FAL_KEY}` },
    });
    const statusText = await statusRes.text();
    let status;
    try { status = JSON.parse(statusText); } catch(_) { status = {}; }
    console.log(`fal [${endpointId}] status:`, status.status, status.error || '');
    if (status.status === 'COMPLETED') {
      await new Promise(r => setTimeout(r, 1000));
      const resultRes = await fetch(resultUrl, {
        headers: { 'Authorization': `Key ${FAL_KEY}` },
      });
      const text = await resultRes.text();
      console.log(`fal [${endpointId}] result (first 200):`, text.slice(0, 200));
      if (!text) throw new Error(`Empty result body from ${endpointId}`);
      return JSON.parse(text);
    }
    if (status.status === 'FAILED') {
      throw new Error(`fal job failed [${endpointId}]: ${JSON.stringify(status)}`);
    }
  }
  throw new Error(`fal job timed out [${endpointId}]`);
}

// Direct synchronous call for endpoints that don't use the queue
async function falRunDirect(endpointId, input) {
  console.log(`fal [${endpointId}] direct call...`);
  const res = await fetch(`https://fal.run/${endpointId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  const text = await res.text();
  console.log(`fal [${endpointId}] direct result (first 200):`, text.slice(0, 200));
  if (!res.ok) throw new Error(`fal direct error (${endpointId}) ${res.status}: ${text.slice(0, 300)}`);
  if (!text) throw new Error(`Empty direct result from ${endpointId}`);
  return JSON.parse(text);
}

function extractUrl(result) {
  return result?.images?.[0]?.url || result?.image?.url || null;
}

const PULID_PARAMS = {
  num_images: 1,
  num_inference_steps: 4,
  guidance_scale: 1.2,
  id_scale: 0.9,
  mode: 'fidelity',
  image_size: { width: 768, height: 1024 },
  negative_prompt: 'blurry, low resolution, bad anatomy, deformed face, cartoon, painting, different person, wrong person, ugly, distorted',
};

Deno.serve(async (req) => {
  console.log('transformPhoto invoked');
  try {
    const base44 = createClientFromRequest(req);

    let body = {};
    try {
      const text = await req.text();
      if (text) body = JSON.parse(text);
    } catch (e) {
      console.log('Body parse error:', e.message);
    }

    const { prompt, original_photo_url, extra_photo_urls = [] } = body;
    console.log('Params:', { prompt: prompt?.slice(0, 80), original_photo_url, extra_count: extra_photo_urls.length });

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!original_photo_url) return Response.json({ error: 'original_photo_url is required' }, { status: 400 });

    const isMultiPerson = extra_photo_urls.length > 0;

    if (!isMultiPerson) {
      // ── SOLO: Single PuLID pass ──────────────────────────────────────────────
      console.log('Running PuLID solo...');
      const result = await falRun('fal-ai/pulid', {
        ...PULID_PARAMS,
        reference_images: [{ image_url: original_photo_url }],
        prompt: `${prompt}, photorealistic, ultra detailed, 8K resolution`,
      });
      const url = extractUrl(result);
      if (!url) throw new Error(`No URL from PuLID: ${JSON.stringify(result).slice(0, 200)}`);
      console.log('Solo done:', url.slice(0, 60));
      return Response.json({ url });
    }

    // ── COUPLES: Run PuLID for each person in parallel, then composite ────────
    console.log('Running PuLID for both people in parallel...');

    // Extract the era description from the prompt for the composite step
    // The prompt already contains era details — use it directly for each person
    const [p1Result, p2Result] = await Promise.all([
      falRun('fal-ai/pulid', {
        ...PULID_PARAMS,
        reference_images: [{ image_url: original_photo_url }],
        prompt: `portrait of a person, ${prompt}, photorealistic, ultra detailed`,
      }),
      falRun('fal-ai/pulid', {
        ...PULID_PARAMS,
        reference_images: [{ image_url: extra_photo_urls[0] }],
        prompt: `portrait of a person, ${prompt}, photorealistic, ultra detailed`,
      }),
    ]);

    const person1Url = extractUrl(p1Result);
    const person2Url = extractUrl(p2Result);
    if (!person1Url) throw new Error(`No URL from PuLID person 1: ${JSON.stringify(p1Result).slice(0, 200)}`);
    if (!person2Url) throw new Error(`No URL from PuLID person 2: ${JSON.stringify(p2Result).slice(0, 200)}`);
    console.log('Both portraits done. Compositing...');

    // Use FLUX Kontext Multi to place both people together in the same scene
    const kontextResult = await falRunDirect('fal-ai/flux-pro/kontext/multi', {
      image_urls: [person1Url, person2Url],
      prompt: `Take the person from the first image and the person from the second image and place them together side by side in a single scene. ${prompt}. Both people must retain their exact facial features, skin tone, and identity from their reference images. They are standing together, looking natural and comfortable. The scene is cohesive, photorealistic, and era-appropriate.`,
      guidance_scale: 3.5,
      num_images: 1,
      output_format: 'jpeg',
    });

    const finalUrl = extractUrl(kontextResult);
    if (!finalUrl) throw new Error(`No URL from Kontext Multi: ${JSON.stringify(kontextResult).slice(0, 200)}`);
    console.log('Couples done:', finalUrl.slice(0, 60));

    return Response.json({ url: finalUrl });

  } catch (error) {
    console.error('transformPhoto error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});