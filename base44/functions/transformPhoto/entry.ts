import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const FACE_ANALYSIS_PROMPT = `You are a forensic portrait artist. Analyze the face of the person in this photo with extreme precision.

Describe in meticulous detail:
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

Be as specific and objective as possible — this description will be used to recreate the exact face in an AI image generator.`;

async function analyzeFace(integrations, photoUrl) {
  const result = await integrations.Core.InvokeLLM({
    model: 'gemini_3_1_pro',
    prompt: FACE_ANALYSIS_PROMPT,
    file_urls: [photoUrl],
    response_json_schema: {
      type: 'object',
      properties: {
        detailed_face_description: {
          type: 'string',
          description: 'A thorough, precise facial description of the person in the photo'
        }
      }
    }
  });
  return result?.detailed_face_description || '';
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

    const allPhotoUrls = [original_photo_url, ...extra_photo_urls];

    // Step 1: Analyze each person's face SEPARATELY for maximum accuracy
    const faceAnalysisPromises = allPhotoUrls.map((url) =>
      analyzeFace(base44.asServiceRole.integrations, url)
    );
    const faceDescriptionsList = await Promise.all(faceAnalysisPromises);

    console.log('Face analyses done:', faceDescriptionsList.length);

    const faceDescriptions = faceDescriptionsList
      .map((desc, i) => `PERSON ${i + 1} (from photo ${i + 1}):\n${desc}`)
      .join('\n\n---\n\n');

    // Step 2: Build the final image generation prompt with all face descriptors embedded
    const isMultiPerson = allPhotoUrls.length > 1;
    const promptBuild = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'gemini_3_1_pro',
      prompt: `You are an expert AI image prompt engineer specializing in photorealistic portrait generation.

FACE REFERENCE DESCRIPTIONS (each person analyzed from their own individual photo — ALL must be preserved exactly):
${faceDescriptions}

ERA/STYLE TRANSFORMATION REQUESTED:
${prompt}

Write a single, highly detailed image generation prompt that:
1. ${isMultiPerson
  ? 'Describes BOTH people in the scene, embedding each person\'s exact face description for their respective subject. Each person must match their description precisely — do NOT swap or blend their features.'
  : 'Embeds the exact face description into the subject description, making facial fidelity the top priority.'}
2. Specifies this is a photorealistic portrait of real ${isMultiPerson ? 'people' : 'a person'} whose face(s) must match the descriptions precisely
3. Describes the era-appropriate costume, hairstyle, background, lighting, and props in rich visual detail
4. Instructs the generator to NOT idealize or alter any face — preserve every described feature exactly
5. Ends with: "hyper-realistic, 8K portrait, photographic quality, true-to-life facial features, distinct individuals"

Facial fidelity for EVERY person is the absolute top priority.`,
      response_json_schema: {
        type: 'object',
        properties: {
          image_prompt: {
            type: 'string',
            description: 'The final detailed image generation prompt with all face descriptors embedded'
          }
        }
      }
    });

    const imagePrompt = promptBuild?.image_prompt;
    console.log('Image prompt length:', imagePrompt?.length);

    if (!imagePrompt) throw new Error('Failed to build image prompt');

    // Step 3: Generate the image, passing ALL original photos as visual anchors
    const imageResult = await base44.asServiceRole.integrations.Core.GenerateImage({
      prompt: imagePrompt,
      existing_image_urls: allPhotoUrls,
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