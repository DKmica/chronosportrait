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

  const statusUrl = submit.status_url || `https://queue.fal.run/requests/${requestId}/status`;
  const responseUrl = submit.response_url || `https://queue.fal.run/requests/${requestId}`;

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
    console.log('Params:', { prompt: prompt?.slice(0, 80), original_photo_url, extra_count: extra_photo_urls.length });

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (!original_photo_url) return Response.json({ error: 'original_photo_url is required' }, { status: 400 });

    const allPhotos = [original_photo_url, ...extra_photo_urls];
    console.log('Total photos:', allPhotos.length);

    let finalUrl;

    if (allPhotos.length === 1) {
      // Single person: use flux-pro image-to-image (img2img) so the prompt is actually applied
      // strength controls how much the prompt overrides the original (0=keep original, 1=ignore original)
      const result = await falQueue('fal-ai/flux-pro/v1.1-ultra', {
        image_url: original_photo_url,
        prompt: prompt,
        image_prompt_strength: 0.15, // 0.15 = heavily guided by text prompt, keeps face loosely
        num_images: 1,
        output_format: 'jpeg',
      });

      console.log('Ultra result:', JSON.stringify(result).slice(0, 200));
      const generatedUrl = result?.images?.[0]?.url;
      if (!generatedUrl) throw new Error(`No image from flux-pro ultra: ${JSON.stringify(result)}`);
      console.log('Generated url:', generatedUrl.slice(0, 60));

      // Face swap to preserve identity
      const faceSwapResult = await falRun('fal-ai/face-swap', {
        base_image_url: generatedUrl,
        swap_image_url: original_photo_url,
      });
      finalUrl = faceSwapResult?.image?.url;
      if (!finalUrl) throw new Error(`No image from face swap: ${JSON.stringify(faceSwapResult)}`);

    } else {
      // Multiple people (couples / group): 
      // Step 1: Generate era scene from the first/main photo
      const result = await falQueue('fal-ai/flux-pro/v1.1-ultra', {
        image_url: original_photo_url,
        prompt: prompt,
        image_prompt_strength: 0.15,
        num_images: 1,
        output_format: 'jpeg',
      });

      console.log('Multi ultra result:', JSON.stringify(result).slice(0, 200));
      const generatedUrl = result?.images?.[0]?.url;
      if (!generatedUrl) throw new Error(`No image from flux-pro ultra (multi): ${JSON.stringify(result)}`);

      // Step 2: Swap the main person's face
      const faceSwap1 = await falRun('fal-ai/face-swap', {
        base_image_url: generatedUrl,
        swap_image_url: original_photo_url,
      });
      let currentUrl = faceSwap1?.image?.url;
      if (!currentUrl) throw new Error(`No image from face swap 1: ${JSON.stringify(faceSwap1)}`);

      // Step 3: For each extra photo, swap the next face in
      for (let i = 0; i < extra_photo_urls.length; i++) {
        console.log(`Swapping extra face ${i + 1}`);
        const swap = await falRun('fal-ai/face-swap', {
          base_image_url: currentUrl,
          swap_image_url: extra_photo_urls[i],
        });
        const swapped = swap?.image?.url;
        if (!swapped) {
          console.warn(`Face swap ${i + 1} failed, keeping previous:`, JSON.stringify(swap));
        } else {
          currentUrl = swapped;
        }
      }
      finalUrl = currentUrl;
    }

    console.log('Final URL:', finalUrl.slice(0, 60));
    return Response.json({ url: finalUrl });

  } catch (error) {
    console.error('transformPhoto error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});