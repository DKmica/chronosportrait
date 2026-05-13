import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const FAL_KEY = Deno.env.get('FAL_API_KEY');

// ── Helpers ────────────────────────────────────────────────────────────────

function extractUrl(result) {
  if (!result) return null;
  return (
    result?.images?.[0]?.url ||
    result?.image?.url ||
    result?.url ||
    result?.data?.images?.[0]?.url ||
    result?.data?.image?.url ||
    result?.data?.url ||
    null
  );
}

// Submit to fal queue and poll until done
async function falQueue(endpointId, input, maxAttempts = 45) {
  const submitRes = await fetch(`https://queue.fal.run/${endpointId}`, {
    method: 'POST',
    headers: { 'Authorization': `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!submitRes.ok) {
    const txt = await submitRes.text();
    throw new Error(`fal queue submit error (${endpointId}) ${submitRes.status}: ${txt.slice(0, 300)}`);
  }
  const { request_id } = await submitRes.json();
  console.log(`[queue] ${endpointId} request_id:`, request_id);

  const statusUrl = `https://queue.fal.run/${endpointId}/requests/${request_id}/status`;
  const resultUrl = `https://queue.fal.run/${endpointId}/requests/${request_id}`;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const statusRes = await fetch(statusUrl, { headers: { 'Authorization': `Key ${FAL_KEY}` } });
    const statusText = await statusRes.text();
    let status = {};
    try { status = JSON.parse(statusText); } catch(_) {}
    console.log(`[queue] ${endpointId} attempt ${i + 1}: ${status.status || 'unknown'}`);

    if (status.status === 'COMPLETED') {
      await new Promise(r => setTimeout(r, 1000));
      const resultRes = await fetch(resultUrl, { headers: { 'Authorization': `Key ${FAL_KEY}` } });
      const text = await resultRes.text();
      console.log(`[queue] ${endpointId} result (first 200):`, text.slice(0, 200));
      if (!text) throw new Error(`Empty result body from ${endpointId}`);
      return JSON.parse(text);
    }
    if (status.status === 'FAILED') {
      throw new Error(`fal queue job failed [${endpointId}]: ${JSON.stringify(status)}`);
    }
  }
  throw new Error(`fal queue job timed out [${endpointId}] after ${maxAttempts} attempts`);
}

// Direct synchronous call (for partner/pro endpoints)
async function falDirect(endpointId, input) {
  console.log(`[direct] ${endpointId} calling...`);
  const res = await fetch(`https://fal.run/${endpointId}`, {
    method: 'POST',
    headers: { 'Authorization': `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const text = await res.text();
  console.log(`[direct] ${endpointId} result (first 200):`, text.slice(0, 200));
  if (!res.ok) throw new Error(`fal direct error (${endpointId}) ${res.status}: ${text.slice(0, 300)}`);
  if (!text) throw new Error(`Empty direct result from ${endpointId}`);
  return JSON.parse(text);
}

const PULID_BASE = {
  num_images: 1,
  num_inference_steps: 4,
  guidance_scale: 1.2,
  id_scale: 0.9,
  mode: 'fidelity',
  image_size: { width: 768, height: 1024 },
  negative_prompt: 'deformed face, wrong identity, merged faces, extra limbs, distorted eyes, bad hands, blurry, low quality, duplicate person, bad anatomy',
};

// ── Solo transformation ────────────────────────────────────────────────────
async function generateSolo(original_photo_url, prompt) {
  console.log('[solo] Running PuLID...');
  const result = await falQueue('fal-ai/pulid', {
    ...PULID_BASE,
    reference_images: [{ image_url: original_photo_url }],
    prompt: `${prompt}, photorealistic, ultra detailed, 8K resolution, sharp focus`,
  });
  const url = extractUrl(result);
  if (!url) throw new Error(`No URL from PuLID solo: ${JSON.stringify(result).slice(0, 300)}`);
  return url;
}

// ── Partners transformation ────────────────────────────────────────────────
async function generatePartners(original_photo_url, extra_photo_url, prompt) {
  console.log('[partners] Running PuLID for both people in parallel...');

  const [p1Result, p2Result] = await Promise.all([
    falQueue('fal-ai/pulid', {
      ...PULID_BASE,
      reference_images: [{ image_url: original_photo_url }],
      prompt: `portrait of a person, ${prompt}, photorealistic, ultra detailed`,
    }),
    falQueue('fal-ai/pulid', {
      ...PULID_BASE,
      reference_images: [{ image_url: extra_photo_url }],
      prompt: `portrait of a person, ${prompt}, photorealistic, ultra detailed`,
    }),
  ]);

  const person1Url = extractUrl(p1Result);
  const person2Url = extractUrl(p2Result);
  if (!person1Url) throw new Error(`No URL from PuLID person A: ${JSON.stringify(p1Result).slice(0, 200)}`);
  if (!person2Url) throw new Error(`No URL from PuLID person B: ${JSON.stringify(p2Result).slice(0, 200)}`);
  console.log('[partners] Both portraits done. Compositing...');

  // Use FLUX Kontext Multi (direct/synchronous endpoint) to place both together
  const kontextResult = await falDirect('fal-ai/flux-pro/kontext/multi', {
    image_urls: [person1Url, person2Url],
    prompt: `Take the person from the first image and the person from the second image and place them together side by side in a single cohesive scene. ${prompt}. Both people must retain their exact facial features, skin tone, and identity. They are two distinct individuals standing together, looking natural. The scene is cohesive, photorealistic, and era-appropriate. Do not merge faces. Keep both people distinct and recognizable.`,
    guidance_scale: 3.5,
    num_images: 1,
    output_format: 'jpeg',
    safety_tolerance: '4',
  });

  const finalUrl = extractUrl(kontextResult);
  if (!finalUrl) throw new Error(`No URL from Kontext Multi: ${JSON.stringify(kontextResult).slice(0, 200)}`);
  return finalUrl;
}

// ── Main handler ──────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  console.log('transformPhoto invoked');

  // Validate API key up front
  if (!FAL_KEY) {
    console.error('FAL_API_KEY is not set');
    return Response.json({
      error: 'AI service is not configured. Please set FAL_API_KEY in your app secrets.',
      error_code: 'MISSING_API_KEY',
    }, { status: 500 });
  }

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
    console.log('Params:', { promptSnippet: prompt?.slice(0, 80), original_photo_url, extra_count: extra_photo_urls.length });

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (!original_photo_url) {
      return Response.json({ error: 'original_photo_url is required' }, { status: 400 });
    }
    if (!prompt) {
      return Response.json({ error: 'prompt is required' }, { status: 400 });
    }

    // Validate URLs are hosted (not local blobs)
    if (original_photo_url.startsWith('blob:') || original_photo_url.startsWith('data:')) {
      return Response.json({ error: 'Photo must be uploaded to a hosted URL before calling transformPhoto.' }, { status: 400 });
    }

    const isPartners = extra_photo_urls.length > 0;

    let url;
    if (isPartners) {
      const partnerUrl = extra_photo_urls[0];
      if (partnerUrl.startsWith('blob:') || partnerUrl.startsWith('data:')) {
        return Response.json({ error: 'Partner photo must be uploaded to a hosted URL.' }, { status: 400 });
      }
      url = await generatePartners(original_photo_url, partnerUrl, prompt);
    } else {
      url = await generateSolo(original_photo_url, prompt);
    }

    console.log('Transform complete:', url.slice(0, 60));
    return Response.json({ url });

  } catch (error) {
    console.error('transformPhoto error:', error.message);

    // Classify error for better UX
    let userMessage = error.message;
    if (error.message.includes('401') || error.message.includes('403')) {
      userMessage = 'AI service authentication failed. Please check your FAL_API_KEY.';
    } else if (error.message.includes('timed out')) {
      userMessage = 'Image generation took too long. Please try again.';
    } else if (error.message.includes('FAILED')) {
      userMessage = 'The AI model rejected this request. Please try a different photo or era.';
    }

    return Response.json({ error: userMessage, raw_error: error.message }, { status: 500 });
  }
});