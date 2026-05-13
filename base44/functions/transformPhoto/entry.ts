import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const FAL_KEY = Deno.env.get('FAL_API_KEY');

// Submit a job to fal queue and poll until done (max ~120s)
async function falRun(endpointId, input) {
  // Submit
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
    throw new Error(`fal submit error ${submitRes.status}: ${txt.slice(0, 300)}`);
  }
  const { request_id } = await submitRes.json();
  console.log('fal request_id:', request_id);

  // Poll for completion
  const statusUrl = `https://queue.fal.run/${endpointId}/requests/${request_id}/status`;
  const resultUrl = `https://queue.fal.run/${endpointId}/requests/${request_id}`;

  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const statusRes = await fetch(statusUrl, {
      headers: { 'Authorization': `Key ${FAL_KEY}` },
    });
    const status = await statusRes.json();
    console.log('fal status:', status.status);
    if (status.status === 'COMPLETED') {
      const resultRes = await fetch(resultUrl, {
        headers: { 'Authorization': `Key ${FAL_KEY}` },
      });
      return resultRes.json();
    }
    if (status.status === 'FAILED') {
      throw new Error(`fal job failed: ${JSON.stringify(status)}`);
    }
  }
  throw new Error('fal job timed out after 120s');
}

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

    // Use fal ip-adapter-face-id for person 1 — this preserves face identity from the photo
    // For couples (2 people), run ip-adapter for person 1 and embed person 2's description in the prompt
    console.log('Running fal ip-adapter-face-id...');

    const isMultiPerson = extra_photo_urls.length > 0;

    // For multi-person, use Gemini to extract person 2 face description to bake into prompt
    let person2FaceDesc = '';
    if (isMultiPerson) {
      const p2Analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
        model: 'gemini_3_1_pro',
        prompt: `Describe this person's face in precise detail: face shape, eye color/shape, nose shape, lip shape, skin tone, hair color/style, approximate age, gender. Be specific and concise.`,
        file_urls: [extra_photo_urls[0]],
        response_json_schema: {
          type: 'object',
          properties: { description: { type: 'string' } }
        }
      });
      person2FaceDesc = p2Analysis?.description || '';
      console.log('Person 2 face desc length:', person2FaceDesc.length);
    }

    const finalPrompt = isMultiPerson
      ? `${prompt}\n\nThe second person in the scene should have these exact features: ${person2FaceDesc}. Ultra high-fidelity, photorealistic, 8K.`
      : `${prompt}\n\nUltra high-fidelity, photorealistic, 8K.`;

    const result = await falRun('fal-ai/ip-adapter-face-id', {
      model_type: '1_5-v2-plus',
      prompt: finalPrompt,
      face_image_url: original_photo_url,
      negative_prompt: 'blurry, low resolution, bad, ugly, deformed face, wrong face, different person, cartoon, painting, illustration',
      guidance_scale: 8,
      num_inference_steps: 50,
      num_samples: 1,
      width: 768,
      height: 768,
    });

    const finalUrl = result?.image?.url || result?.images?.[0]?.url;
    if (!finalUrl) throw new Error(`No URL from ip-adapter: ${JSON.stringify(result).slice(0, 200)}`);

    console.log('Done:', finalUrl.slice(0, 60));
    return Response.json({ url: finalUrl });

  } catch (error) {
    console.error('transformPhoto error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});