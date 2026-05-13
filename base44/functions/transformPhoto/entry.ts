import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_MODEL = 'gemini-2.5-flash-image';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ── Helpers ────────────────────────────────────────────────────────────────

// Fetch an image URL and convert to base64
async function imageUrlToBase64(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image from URL (${res.status}): ${url.slice(0, 80)}`);
  const buffer = await res.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return {
    base64: btoa(binary),
    mimeType: res.headers.get('content-type')?.split(';')[0] || 'image/jpeg',
  };
}

// Call Gemini image generation with multipart content
async function callGemini(parts) {
  const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }),
  });

  const text = await res.text();
  console.log('[gemini] status:', res.status, '| response (first 400):', text.slice(0, 400));

  if (!res.ok) throw new Error(`Gemini API error ${res.status}: ${text.slice(0, 400)}`);

  const data = JSON.parse(text);
  for (const candidate of (data?.candidates || [])) {
    for (const part of (candidate?.content?.parts || [])) {
      if (part.inlineData?.data) {
        return { base64: part.inlineData.data, mimeType: part.inlineData.mimeType || 'image/jpeg' };
      }
    }
  }
  throw new Error(`No image in Gemini response: ${text.slice(0, 300)}`);
}

// Upload base64 image as a hosted URL via Base44 UploadFile integration
async function uploadBase64AsUrl(base44, base64Data, mimeType) {
  const binaryStr = atob(base64Data);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
  const blob = new Blob([bytes], { type: mimeType });

  const form = new FormData();
  const ext = mimeType.includes('png') ? 'png' : 'jpg';
  form.append('file', blob, `output.${ext}`);

  const result = await base44.asServiceRole.integrations.Core.UploadFile({ file: blob });
  return result?.file_url;
}

// ── Solo transformation ────────────────────────────────────────────────────
async function generateSolo(base44, original_photo_url, prompt) {
  console.log('[solo] Fetching reference image...');
  const { base64, mimeType } = await imageUrlToBase64(original_photo_url);

  const parts = [
    { inlineData: { mimeType, data: base64 } },
    {
      text: `This is the reference photo of a person. Generate a photorealistic portrait of THIS EXACT PERSON placed in the following scene: ${prompt}.

Identity preservation rules (CRITICAL):
- The person's face must be pixel-perfect identical to the reference — same bone structure, skin tone, eye color, nose shape, lip shape, hair color and texture.
- Do NOT beautify, idealize, or alter their face in any way.
- Only change the clothing, background, and lighting to match the era/scene.
- Ultra detailed, 8K resolution, sharp focus, cinematic lighting.`,
    },
  ];

  console.log('[solo] Calling Gemini...');
  const result = await callGemini(parts);
  const url = await uploadBase64AsUrl(base44, result.base64, result.mimeType);
  if (!url) throw new Error('Failed to upload result');
  return url;
}

// ── Partners transformation ────────────────────────────────────────────────
async function generatePartners(base44, original_photo_url, extra_photo_url, prompt) {
  console.log('[partners] Fetching both reference images...');
  const [imgA, imgB] = await Promise.all([
    imageUrlToBase64(original_photo_url),
    imageUrlToBase64(extra_photo_url),
  ]);

  const parts = [
    { text: 'Reference image 1 — Person A (first person):' },
    { inlineData: { mimeType: imgA.mimeType, data: imgA.base64 } },
    { text: 'Reference image 2 — Person B (second person):' },
    { inlineData: { mimeType: imgB.mimeType, data: imgB.base64 } },
    {
      text: `Generate a single photorealistic image with BOTH Person A and Person B together in this scene: ${prompt}.

Identity preservation rules (CRITICAL):
- Person A's face must be IDENTICAL to Reference image 1 — exact facial structure, skin tone, eye color, hair, and every distinguishing feature.
- Person B's face must be IDENTICAL to Reference image 2 — exact facial structure, skin tone, eye color, hair, and every distinguishing feature.
- Do NOT merge their faces, do NOT invent new faces, do NOT show only one person.
- Both people must be clearly visible with their original identities fully intact.
- Only change their clothing, background, and lighting to match the scene.
- Photorealistic, cinematic lighting, ultra detailed, 8K resolution.`,
    },
  ];

  console.log('[partners] Calling Gemini...');
  const result = await callGemini(parts);
  const url = await uploadBase64AsUrl(base44, result.base64, result.mimeType);
  if (!url) throw new Error('Failed to upload result');
  return url;
}

// ── Main handler ──────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  console.log('transformPhoto invoked');

  if (!GEMINI_API_KEY) {
    return Response.json({
      error: 'AI service is not configured. Please set GEMINI_API_KEY in your app secrets.',
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
    console.log('Params:', { promptSnippet: prompt?.slice(0, 80), original_photo_url: original_photo_url?.slice(0, 60), extra_count: extra_photo_urls.length });

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (!original_photo_url) return Response.json({ error: 'original_photo_url is required' }, { status: 400 });
    if (!prompt) return Response.json({ error: 'prompt is required' }, { status: 400 });

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
      url = await generatePartners(base44, original_photo_url, partnerUrl, prompt);
    } else {
      url = await generateSolo(base44, original_photo_url, prompt);
    }

    console.log('Transform complete:', url?.slice(0, 60));
    return Response.json({ url });

  } catch (error) {
    console.error('transformPhoto error:', error.message);

    let userMessage = error.message;
    if (error.message.includes('401') || error.message.includes('403')) {
      userMessage = 'AI service authentication failed. Please check your GEMINI_API_KEY.';
    } else if (error.message.includes('429') || error.message.includes('quota')) {
      userMessage = 'Gemini API quota exceeded. Please enable billing on your Google AI account at https://aistudio.google.com.';
    } else if (error.message.includes('timed out')) {
      userMessage = 'Image generation took too long. Please try again.';
    } else if (error.message.toLowerCase().includes('safety') || error.message.includes('RECITATION')) {
      userMessage = 'The image was blocked by safety filters. Please try a different photo or era.';
    }

    return Response.json({ error: userMessage, raw_error: error.message }, { status: 500 });
  }
});