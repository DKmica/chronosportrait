import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const FAL_KEY = Deno.env.get('FAL_API_KEY');

async function falPost(url, bodyObj) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyObj),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Fal error [${url}]: ${text}`);
  return JSON.parse(text);
}

async function falGet(url) {
  const res = await fetch(url, {
    headers: { 'Authorization': `Key ${FAL_KEY}` },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Fal GET error [${url}]: ${text}`);
  return JSON.parse(text);
}

async function falQueue(endpoint, bodyObj) {
  console.log('Submitting to queue:', endpoint);
  const submit = await falPost(`https://queue.fal.run/${endpoint}`, bodyObj);
  const requestId = submit.request_id;
  if (!requestId) throw new Error(`No request_id from queue submit: ${JSON.stringify(submit)}`);

  // Use the response_url and status_url if provided (Fal v2 pattern)
  const statusUrl = submit.status_url || `https://queue.fal.run/requests/${requestId}/status`;
  const responseUrl = submit.response_url || `https://queue.fal.run/requests/${requestId}`;
  console.log('Status URL:', statusUrl);

  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const status = await falGet(statusUrl);
    console.log(`Queue status [${i}]:`, status.status);
    if (status.status === 'COMPLETED') {
      return falGet(responseUrl);
    }
    if (status.status === 'FAILED') {
      throw new Error(`Queue job failed: ${JSON.stringify(status)}`);
    }
  }
  throw new Error('Queue job timed out');
}

async function falRun(endpoint, bodyObj) {
  console.log('Running direct:', endpoint);
  return falPost(`https://fal.run/${endpoint}`, bodyObj);
}

Deno.serve(async (req) => {
  console.log('transformPhoto invoked');
  try {
    const base44 = createClientFromRequest(req);

    let body = {};
    try {
      const text = await req.text();
      console.log('Raw body length:', text.length);
      if (text) body = JSON.parse(text);
    } catch (e) {
      console.log('Body parse error:', e.message);
    }

    const { prompt, original_photo_url, extra_photo_urls = [] } = body;
    console.log('Params:', { prompt: prompt?.slice(0, 50), original_photo_url, extra_count: extra_photo_urls.length });

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (!original_photo_url) return Response.json({ error: 'original_photo_url is required' }, { status: 400 });

    // Step 1: Flux Redux — style the image to match the era
    const fluxResult = await falQueue('fal-ai/flux-pro/v1.1/redux', {
      image_url: original_photo_url,
      prompt: prompt,
      num_images: 1,
      guidance_scale: 3.5,
      num_inference_steps: 28,
      image_size: 'portrait_4_3',
    });

    const generatedUrl = fluxResult?.images?.[0]?.url;
    if (!generatedUrl) throw new Error(`No image URL from Flux Redux: ${JSON.stringify(fluxResult)}`);
    console.log('Flux done, url:', generatedUrl.slice(0, 60));

    // Step 2: Face swap — put original face onto era image
    const faceSwapResult = await falRun('fal-ai/face-swap', {
      base_image_url: generatedUrl,
      swap_image_url: original_photo_url,
    });

    const finalUrl = faceSwapResult?.image?.url;
    if (!finalUrl) throw new Error(`No image URL from face swap: ${JSON.stringify(faceSwapResult)}`);
    console.log('Face swap done, url:', finalUrl.slice(0, 60));

    return Response.json({ url: finalUrl });
  } catch (error) {
    console.error('transformPhoto error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});