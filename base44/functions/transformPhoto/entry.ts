import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_MODEL = 'gemini-2.5-flash-image';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const MAX_PEOPLE = 10;
const FREE_DAILY_LIMIT = 3;
const TRANSFORMATION_COST = 1;

// ── Credit Helpers ──────────────────────────────────────────────────────────

async function checkAndDeductCredits(base44, userEmail) {
  const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: userEmail }, '-updated_date');
  const profile = profiles?.[0];
  if (!profile) return { ok: false, error: 'User profile not found', status: 404 };

  const isPro = profile.plan === 'pro_monthly' || profile.plan === 'pro_yearly';
  if (isPro) return { ok: true, profile, deducted: null };

  const today = new Date().toISOString().split('T')[0];
  const isNewDay = profile.last_transform_date !== today;
  const usedToday = isNewDay ? 0 : (profile.transformations_today || 0);
  const dailyLeft = FREE_DAILY_LIMIT - usedToday;
  const bonus = profile.bonus_transformations || 0;
  const credits = profile.credits || 0;

  const update = {
    last_transform_date: today,
    total_transformations: (profile.total_transformations || 0) + 1,
  };
  let deductionType = null;

  if (dailyLeft > 0) {
    update.transformations_today = isNewDay ? 1 : usedToday + 1;
    deductionType = 'daily';
  } else if (bonus >= TRANSFORMATION_COST) {
    update.bonus_transformations = bonus - TRANSFORMATION_COST;
    deductionType = 'bonus';
  } else if (credits >= TRANSFORMATION_COST) {
    update.credits = credits - TRANSFORMATION_COST;
    deductionType = 'credits';
  } else {
    return {
      ok: false,
      error: 'You are out of transformations. Upgrade to Pro for unlimited generations.',
      error_code: 'INSUFFICIENT_CREDITS',
      status: 402,
    };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split('T')[0];
  const currentStreak = profile.streak_days || 0;
  let newStreak = currentStreak;
  if (profile.last_streak_date !== today) {
    newStreak = (profile.last_streak_date === yStr || profile.last_streak_date === profile.streak_freeze_used_date)
      ? currentStreak + 1 : 1;
  }
  const history = profile.streak_history || [];
  update.streak_days = newStreak;
  update.last_streak_date = today;
  update.streak_history = history.includes(today) ? history : [...history, today].slice(-90);
  update.challenge_completed_date = today;

  await base44.asServiceRole.entities.UserProfile.update(profile.id, update);
  return { ok: true, profile, deducted: { type: deductionType } };
}

async function refundCredits(base44, userEmail, deducted) {
  if (!deducted) return;
  const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: userEmail }, '-updated_date');
  const profile = profiles?.[0];
  if (!profile) return;

  const refund = { total_transformations: Math.max(0, (profile.total_transformations || 0) - 1) };
  if (deducted.type === 'daily') {
    refund.transformations_today = Math.max(0, (profile.transformations_today || 0) - 1);
  } else if (deducted.type === 'bonus') {
    refund.bonus_transformations = (profile.bonus_transformations || 0) + TRANSFORMATION_COST;
  } else if (deducted.type === 'credits') {
    refund.credits = (profile.credits || 0) + TRANSFORMATION_COST;
  }
  await base44.asServiceRole.entities.UserProfile.update(profile.id, refund);
}

// ── Image Helpers ────────────────────────────────────────────────────────────

function isPrivateIp(ip) {
  // IPv4 checks
  const v4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [parseInt(v4[1]), parseInt(v4[2])];
    if (a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a === 0 || a >= 224) {
      return true;
    }
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    return false;
  }
  // IPv6 loopback and ULA
  if (ip === '::1' || ip.startsWith('fc') || ip.startsWith('fd')) return true;
  return false;
}

async function assertSafeImageUrl(url) {
  if (!url || typeof url !== 'string') throw new Error('Invalid image URL');
  let parsed;
  try { parsed = new URL(url); } catch { throw new Error('Invalid image URL'); }
  if (parsed.protocol !== 'https:') throw new Error('Only HTTPS image URLs are allowed');
  const host = parsed.hostname.toLowerCase();
  if (host === 'metadata' || host === 'metadata.google.internal') {
    throw new Error('Blocked internal image URL');
  }
  // Resolve hostname to IP(s) to prevent DNS-based SSRF bypass
  const ips = await Deno.resolveDns(host, 'A').catch(() => []);
  const ips6 = await Deno.resolveDns(host, 'AAAA').catch(() => []);
  const allIps = [...ips, ...ips6];
  if (allIps.length === 0) throw new Error('Could not resolve image URL host');
  for (const ip of allIps) {
    if (isPrivateIp(ip)) throw new Error('Blocked private image URL');
  }
  return url;
}

async function imageUrlToBase64(url) {
  await assertSafeImageUrl(url);
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
      safetySettings: [
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      ],
    }),
  });

  const text = await res.text();
  console.log('[gemini] status:', res.status, '| response (first 400):', text.slice(0, 400));

  if (!res.ok) throw new Error(`Gemini API error ${res.status}: ${text.slice(0, 400)}`);

  const data = JSON.parse(text);
  const candidate = data?.candidates?.[0];

  if (candidate?.finishReason === 'SAFETY' || candidate?.finishReason === 'PROHIBITED_CONTENT' || candidate?.finishReason === 'RECITATION') {
    throw new Error('SAFETY_VIOLATION');
  }

  for (const c of (data?.candidates || [])) {
    for (const part of (c?.content?.parts || [])) {
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

const GENERATED_FILENAME_PATTERNS = ['generated_image', 'ai-generated'];

function looksLikeGeneratedImage(url) {
  if (!url) return false;
  const filename = url.split('/').pop().toLowerCase().split('?')[0];
  return GENERATED_FILENAME_PATTERNS.some(p => filename.includes(p));
}

// ── Multi-person generation ─────────────────────────────────────────────────

async function generateMultiPerson(base44, allPhotoUrls, prompt) {
  const personCount = allPhotoUrls.length;
  console.log(`[generate] Fetching ${personCount} reference image(s)...`);

  const images = await Promise.all(allPhotoUrls.map(url => imageUrlToBase64(url)));

  const parts = [];
  parts.push({ text: `I am uploading exactly ${personCount} reference photo${personCount === 1 ? '' : 's'} below, one per person. Each person must appear exactly once in the output.\n` });

  for (let i = 0; i < images.length; i++) {
    parts.push({ text: `--- PERSON ${i + 1} OF ${personCount} ---\nIMPORTANT: Copy this person's exact face into the output. Preserve their face shape, eyes, nose, mouth, skin tone, age, and all unique features. This is Person ${i + 1} — do not change, merge, or replace their face.` });
    parts.push({ inlineData: { mimeType: images[i].mimeType, data: images[i].base64 } });
  }

  parts.push({ text: `--- END OF REFERENCE IMAGES (${personCount} total) ---\n\n${prompt}` });

  console.log(`[generate] Calling Gemini with ${personCount} person(s)...`);
  const result = await callGemini(parts);
  const url = await uploadBase64AsUrl(base44, result.base64, result.mimeType);
  if (!url) throw new Error('Failed to upload generated image');
  return url;
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  console.log('transformPhoto invoked');

  if (!GEMINI_API_KEY) {
    return Response.json({
      error: 'AI service is not configured. Please set GEMINI_API_KEY in your app secrets.',
      error_code: 'MISSING_API_KEY',
    }, { status: 500 });
  }

  let body = {};
  try {
    const text = await req.text();
    if (text) body = JSON.parse(text);
  } catch (e) {
    console.log('Body parse error:', e.message);
  }

  const { prompt, original_photo_url, extra_photo_urls = [], transformation_id } = body;
  const personCount = 1 + extra_photo_urls.length;
  const allUrls = [original_photo_url, ...extra_photo_urls];

  console.log('[debug]', {
    personCount,
    original_photo_url: original_photo_url?.slice(0, 80),
    extra_photo_count: extra_photo_urls.length,
    transformation_id,
    promptPreview: prompt?.slice(0, 120),
    provider: 'gemini',
  });

  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (!original_photo_url) {
      return Response.json({ error: 'original_photo_url is required' }, { status: 400 });
    }
    if (!prompt) {
      return Response.json({ error: 'prompt is required' }, { status: 400 });
    }
    if (personCount > MAX_PEOPLE) {
      return Response.json({
        error: `Group mode currently supports up to ${MAX_PEOPLE} people. You uploaded ${personCount}.`,
      }, { status: 400 });
    }

    for (let i = 0; i < allUrls.length; i++) {
      if (isInvalidUrl(allUrls[i])) {
        return Response.json({
          error: `Person ${i + 1}'s photo must be uploaded to a hosted URL before generating. Please re-upload and try again.`,
        }, { status: 400 });
      }
      if (looksLikeGeneratedImage(allUrls[i])) {
        console.warn(`[warn] Person ${i + 1} URL looks like a generated image:`, allUrls[i].slice(0, 80));
        return Response.json({
          error: `Please upload original face photos, not previously generated ChronosBooth images. Generated images reduce face accuracy. (Person ${i + 1})`,
          error_code: 'GENERATED_IMAGE_REFERENCE',
        }, { status: 400 });
      }
    }

    const creditCheck = await checkAndDeductCredits(base44, user.email);
    if (!creditCheck.ok) {
      return Response.json({
        error: creditCheck.error,
        error_code: creditCheck.error_code || 'INSUFFICIENT_CREDITS',
      }, { status: creditCheck.status || 402 });
    }

    console.log(`[main] Starting generation for ${personCount} person(s)...`);

    let url;
    try {
      url = await generateMultiPerson(base44, allUrls, prompt);
    } catch (genError) {
      await refundCredits(base44, user.email, creditCheck.deducted);

      if (genError.message === 'SAFETY_VIOLATION' || genError.message.toLowerCase().includes('safety')) {
        return Response.json({
          error: 'The image was blocked by safety filters. Please try a different photo or era.',
          error_code: 'SAFETY_VIOLATION',
        }, { status: 400 });
      }

      throw genError;
    }

    console.log('[main] Transform complete:', url?.slice(0, 80));
    return Response.json({ url });

  } catch (error) {
    console.error('[error] transformPhoto:', error.message);

    let userMessage = error.message;
    if (error.message.includes('401') || error.message.includes('403')) {
      userMessage = 'AI service authentication failed. Please check your GEMINI_API_KEY.';
    } else if (error.message.includes('429') || error.message.includes('quota')) {
      userMessage = 'Gemini API quota exceeded. Please enable billing on your Google AI account at https://aistudio.google.com.';
    } else if (error.message.includes('timed out')) {
      userMessage = 'Image generation took too long. Please try again.';
    }

    return Response.json({ error: userMessage, raw_error: error.message }, { status: 500 });
  }
});