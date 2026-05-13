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
    const status = await statusRes.json();
    console.log(`fal [${endpointId}] status:`, status.status);
    if (status.status === 'COMPLETED') {
      const resultRes = await fetch(resultUrl, {
        headers: { 'Authorization': `Key ${FAL_KEY}` },
      });
      return resultRes.json();
    }
    if (status.status === 'FAILED') {
      throw new Error(`fal job failed [${endpointId}]: ${JSON.stringify(status)}`);
    }
  }
  throw new Error(`fal job timed out [${endpointId}]`);
}

function extractUrl(result) {
  return result?.images?.[0]?.url || result?.image?.url || null;
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

    const isMultiPerson = extra_photo_urls.length > 0;

    // ── STEP 1: Generate person 1 in-era using PuLID (face identity preserved) ──
    console.log('Running PuLID for person 1...');
    const pulidResult = await falRun('fal-ai/pulid', {
      reference_images: [{ image_url: original_photo_url }],
      prompt: `${prompt}, photorealistic, ultra detailed, 8K resolution`,
      negative_prompt: 'blurry, low resolution, bad anatomy, deformed face, cartoon, painting, different person, wrong person, ugly, distorted',
      num_images: 1,
      num_inference_steps: 4,
      guidance_scale: 1.2,
      id_scale: 0.9,
      mode: 'fidelity',
      image_size: { width: 768, height: 1024 },
    });

    const person1Url = extractUrl(pulidResult);
    if (!person1Url) throw new Error(`No URL from PuLID: ${JSON.stringify(pulidResult).slice(0, 200)}`);
    console.log('Person 1 done:', person1Url.slice(0, 60));

    if (!isMultiPerson) {
      return Response.json({ url: person1Url });
    }

    // ── STEP 2 (couples): Describe person 2's face, then use FLUX Kontext ────────
    // to add them into the scene while keeping person 1 intact
    console.log('Describing person 2 face...');
    const p2Analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'gemini_3_1_pro',
      prompt: `Look at this photo and describe this person's face and appearance in detail. Include: gender, approximate age, skin tone, face shape, eye color, hair color and style, any distinctive features. Be specific and concise — 2-3 sentences max.`,
      file_urls: [extra_photo_urls[0]],
      response_json_schema: {
        type: 'object',
        properties: { description: { type: 'string' } }
      }
    });
    const person2Desc = p2Analysis?.description || 'a person';
    console.log('Person 2 description:', person2Desc);

    // Use FLUX Kontext to edit the person-1 image and add person 2 beside them
    console.log('Running FLUX Kontext to add person 2...');
    const kontextResult = await falRun('fal-ai/flux-kontext', {
      image_url: person1Url,
      prompt: `Add a second person standing next to the first person. The second person looks like this: ${person2Desc}. They are dressed in matching era-appropriate clothing that fits the scene. Keep everything else — the background, setting, lighting, and the first person — exactly the same. Both people look photorealistic and natural together.`,
      num_inference_steps: 30,
      guidance_scale: 2.5,
      num_images: 1,
      output_format: 'jpeg',
      resolution_mode: 'match_input',
    });

    const finalUrl = extractUrl(kontextResult);
    if (!finalUrl) throw new Error(`No URL from Kontext: ${JSON.stringify(kontextResult).slice(0, 200)}`);
    console.log('Couples done:', finalUrl.slice(0, 60));

    return Response.json({ url: finalUrl });

  } catch (error) {
    console.error('transformPhoto error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});