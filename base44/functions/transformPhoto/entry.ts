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

    const fileUrls = [original_photo_url, ...extra_photo_urls];

    // Step 1: Extract precise facial descriptors from the reference photo(s)
    const faceAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'gemini_3_1_pro',
      prompt: `You are a forensic portrait artist. Analyze the face(s) in the provided photo(s) with extreme precision.

For each person visible, describe in meticulous detail:
- Face shape (oval, round, square, heart, etc.)
- Eye shape, color, and spacing
- Eyebrow shape, thickness, and color
- Nose shape (bridge width, tip shape, nostril size)
- Lip shape, fullness, and color
- Jawline and chin definition
- Cheekbone prominence
- Skin tone (use specific descriptors like "warm olive", "cool fair", "deep brown", etc.)
- Any distinctive features (dimples, freckles, moles, scars)
- Approximate age and gender presentation
- Hair color, texture, and natural growth pattern

Be as specific and objective as possible — this description will be used to recreate the exact face in an AI image generator.`,
      file_urls: fileUrls,
      response_json_schema: {
        type: 'object',
        properties: {
          face_descriptions: {
            type: 'array',
            description: 'One entry per person in the photo, each with a thorough facial description',
            items: {
              type: 'object',
              properties: {
                person_index: { type: 'number' },
                detailed_face_description: { type: 'string' }
              }
            }
          }
        }
      }
    });

    console.log('Face analysis done, persons found:', faceAnalysis?.face_descriptions?.length);

    const faceDescriptions = (faceAnalysis?.face_descriptions || [])
      .map((f, i) => `Person ${i + 1}: ${f.detailed_face_description}`)
      .join('\n\n');

    // Step 2: Build the final image generation prompt using the extracted face descriptors
    const promptBuild = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'gemini_3_1_pro',
      prompt: `You are an expert AI image prompt engineer specializing in photorealistic portrait generation.

FACE REFERENCE DESCRIPTIONS (extracted directly from uploaded photos — these must be preserved exactly):
${faceDescriptions}

ERA/STYLE TRANSFORMATION REQUESTED:
${prompt}

Write a single, highly detailed image generation prompt that:
1. Opens with the exact face description above (embedded verbatim into the subject description)
2. Specifies that this is a photorealistic portrait of a real person whose face must match the description precisely
3. Describes the era-appropriate costume, hairstyle, background, lighting, and props in rich visual detail
4. Instructs the generator to NOT change or idealize the face — preserve every described feature exactly
5. Ends with technical quality tags: "hyper-realistic, 8K portrait, photographic quality, true-to-life facial features"

The prompt must make facial fidelity the top priority.`,
      response_json_schema: {
        type: 'object',
        properties: {
          image_prompt: {
            type: 'string',
            description: 'The final detailed image generation prompt with face descriptors embedded'
          }
        }
      }
    });

    const imagePrompt = promptBuild?.image_prompt;
    console.log('Image prompt length:', imagePrompt?.length);

    if (!imagePrompt) throw new Error('Failed to build image prompt');

    // Step 3: Generate the image, passing the original photos as visual anchors
    const imageResult = await base44.asServiceRole.integrations.Core.GenerateImage({
      prompt: imagePrompt,
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