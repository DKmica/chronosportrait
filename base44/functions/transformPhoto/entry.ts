import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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

    // Build file_urls array — main photo + any extra photos
    const fileUrls = [original_photo_url, ...extra_photo_urls];

    // Use Gemini via InvokeLLM to generate the transformed portrait
    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'gemini_3_1_pro',
      prompt: `You are an expert portrait artist. You will receive reference photo(s) of real people. 
Your task: Generate a high-quality AI portrait image of the person(s) transformed into the described era/style.

CRITICAL RULES:
- Preserve the exact facial features, skin tone, bone structure, and likeness of each person from the reference photos
- Only change: clothing, hairstyle, background, lighting, and era-appropriate props/setting
- Do NOT alter face shape, eye color, or any identifying features
- Output a single cohesive portrait image

${prompt}`,
      file_urls: fileUrls,
      response_json_schema: {
        type: 'object',
        properties: {
          image_prompt: {
            type: 'string',
            description: 'A highly detailed image generation prompt describing the transformed portrait, including all visual details of clothing, background, lighting, and style while describing the person\'s appearance from the reference photos'
          }
        }
      }
    });

    console.log('Gemini image_prompt length:', result?.image_prompt?.length);

    if (!result?.image_prompt) {
      throw new Error('Gemini did not return an image prompt');
    }

    // Now generate the actual image using Gemini image generation
    const imageResult = await base44.asServiceRole.integrations.Core.GenerateImage({
      prompt: result.image_prompt,
      existing_image_urls: fileUrls,
    });

    const finalUrl = imageResult?.url;
    if (!finalUrl) throw new Error(`No image URL from GenerateImage: ${JSON.stringify(imageResult)}`);

    console.log('Final URL:', finalUrl.slice(0, 60));
    return Response.json({ url: finalUrl });

  } catch (error) {
    console.error('transformPhoto error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});