import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const FAL_API_KEY = Deno.env.get('FAL_API_KEY');

async function falRun(endpoint, body) {
  // Try direct run first (faster, synchronous)
  const res = await fetch(`https://fal.run/${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Fal API error (${endpoint}): ${err}`);
  }

  return res.json();
}

async function falQueue(endpoint, body) {
  const submitRes = await fetch(`https://queue.fal.run/${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!submitRes.ok) {
    const err = await submitRes.text();
    throw new Error(`Fal submit error (${endpoint}): ${err}`);
  }
  const { request_id } = await submitRes.json();

  // Poll for result
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const statusRes = await fetch(`https://queue.fal.run/${endpoint}/requests/${request_id}/status`, {
      headers: { 'Authorization': `Key ${FAL_API_KEY}` },
    });
    const status = await statusRes.json();
    if (status.status === 'COMPLETED') {
      const resultRes = await fetch(`https://queue.fal.run/${endpoint}/requests/${request_id}`, {
        headers: { 'Authorization': `Key ${FAL_API_KEY}` },
      });
      return resultRes.json();
    }
    if (status.status === 'FAILED') {
      throw new Error(`Fal job failed: ${JSON.stringify(status)}`);
    }
  }
  throw new Error('Fal job timed out after 3 minutes');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, original_photo_url, extra_photo_urls = [] } = await req.json();

    // Step 1: Generate era-transformed image using Flux Redux (image-to-image stylization)
    // flux-pro/v1.1/redux: takes image_url + optional prompt, returns images array
    const fluxResult = await falQueue('fal-ai/flux-pro/v1.1/redux', {
      image_url: original_photo_url,
      prompt: prompt,
      num_images: 1,
      guidance_scale: 3.5,
      num_inference_steps: 28,
      image_size: 'portrait_4_3',
    });

    const generatedUrl = fluxResult?.images?.[0]?.url;
    if (!generatedUrl) {
      throw new Error(`No image from Flux Redux. Response: ${JSON.stringify(fluxResult)}`);
    }

    // Step 2: Swap the original face onto the era-generated image for identity preservation
    // face-swap: base_image_url = generated era image, swap_image_url = source face
    const faceSwapResult = await falRun('fal-ai/face-swap', {
      base_image_url: generatedUrl,
      swap_image_url: original_photo_url,
    });

    const finalUrl = faceSwapResult?.image?.url;
    if (!finalUrl) {
      throw new Error(`No image from face swap. Response: ${JSON.stringify(faceSwapResult)}`);
    }

    return Response.json({ url: finalUrl });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});