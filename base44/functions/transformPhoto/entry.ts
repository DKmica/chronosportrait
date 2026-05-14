import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_MODEL = 'gemini-2.5-flash-image';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const MAX_PEOPLE = 6;

// ── Helpers ────────────────────────────────────────────────────────────────

async function imageUrlToBase64(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image (${res.status}): ${url.slice(0, 80)}`);
  const buffer = await res.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return {
    base64: btoa(binary),
    mimeType: res.headers.get('content-type')?.split(';')[0] || 'image/jpeg',
  };
}

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

async function uploadBase64AsUrl(base44, base64Data, mimeType) {
  const binaryStr = atob(base64Data);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
  const blob = new Blob([bytes], { type: mimeType });
  const ext = mimeType.includes('png') ? 'png' : 'jpg';
  const file = new File([blob], `output.${ext}`, { type: mimeType });
  const result = await base44.asServiceRole.integrations.Core.UploadFile({ file });
  return result?.file_url;
}

function isInvalidUrl(url) {
  return !url || url.startsWith('blob:') || url.startsWith('data:');
}

// ── Multi-person generation ─────────────────────────────────────────────────

/**
 * Generates a portrait for 1–6 people using strict identity-preservation logic.
 * All reference images are passed to Gemini in labeled order.
 */
async function generateMultiPerson(base44, allPhotoUrls, prompt) {
  const personCount = allPhotoUrls.length;
  console.log(`[generate] Fetching ${personCount} reference image(s)...`);

  const images = await Promise.all(allPhotoUrls.map(url => imageUrlToBase64(url)));

  // Build parts: interleave label + image for each person
  const parts = [];
  for (let i = 0; i < images.length; i++) {
    parts.push({ text: `Reference Image ${i + 1} — Person ${i + 1}:` });
    parts.push({ inlineData: { mimeType: images[i].mimeType, data: images[i].base64 } });
  }

  // Add the main prompt
  parts.push({ text: prompt });

  console.log(`[generate] Calling Gemini with ${personCount} person(s)...`);
  const result = await callGemini(parts);
  const url = await uploadBase64AsUrl(base44, result.base64, result.mimeType);
  if (!url) throw new Error('Failed to upload generated image');
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
    const personCount = 1 + extra_photo_urls.length;

    console.log('Params:', {
      promptSnippet: prompt?.slice(0, 80),
      original_photo_url: original_photo_url?.slice(0, 60),
      extra_count: extra_photo_urls.length,
      personCount,
    });

    // Auth
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Validation
    if (!original_photo_url) {
      return Response.json({ error: 'original_photo_url is required' }, { status: 400 });
    }
    if (!prompt) {
      return Response.json({ error: 'prompt is required' }, { status: 400 });
    }
    if (personCount > MAX_PEOPLE) {
      return Response.json({
        error: `Group mode currently supports up to ${MAX_PEOPLE} people for best face accuracy. You uploaded ${personCount}.`,
      }, { status: 400 });
    }

    // Validate all URLs
    const allUrls = [original_photo_url, ...extra_photo_urls];
    for (let i = 0; i < allUrls.length; i++) {
      if (isInvalidUrl(allUrls[i])) {
        return Response.json({
          error: `Person ${i + 1}'s photo must be uploaded to a hosted URL before generating. Please re-upload and try again.`,
        }, { status: 400 });
      }
    }

    console.log(`[main] Starting generation for ${personCount} person(s)...`);
    const url = await generateMultiPerson(base44, allUrls, prompt);

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