import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const FAL_API_KEY = Deno.env.get('FAL_API_KEY');
const FAL_SYNC_BASE = 'https://fal.run';

// Solo mode (1 person): identity-preserving edit of the user's photo.
const MODEL_SOLO = 'fal-ai/flux-pro/kontext/max';
// Partners / group mode (>=2 people): text-to-image scene generation.
const MODEL_MULTI = 'fal-ai/flux-pro/v1.1';

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

const ALLOWED_IMAGE_HOSTS = ['base44.app'];

function assertSafeImageUrl(url) {
  if (!url || typeof url !== 'string') throw new Error('Invalid image URL');
  let parsed;
  try { parsed = new URL(url); } catch { throw new Error('Invalid image URL'); }
  if (parsed.protocol !== 'https:') throw new Error('Only HTTPS image URLs are allowed');
  const host = parsed.hostname.toLowerCase();
  // Strict host allowlist — all uploaded files are hosted on base44.app.
  // We pass these URLs to Fal.ai, so validating the host prevents SSRF.
  const isAllowed = ALLOWED_IMAGE_HOSTS.some(h => host === h || host.endsWith('.' + h));
  if (!isAllowed) throw new Error('Image URL host is not allowed');
  return url;
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

// ── Fal.ai generation ────────────────────────────────────────────────────────

async function callFalSync(modelId, input) {
  const url = `${FAL_SYNC_BASE}/${modelId}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(120000),
  });

  const text = await res.text();
  console.log(`[fal ${modelId}] status:`, res.status, '| preview:', text.slice(0, 400));

  if (!res.ok) throw new Error(`Fal API error ${res.status}: ${text.slice(0, 400)}`);

  const data = JSON.parse(text);
  const imageUrl = data?.images?.[0]?.url || data?.image?.url;
  if (!imageUrl) throw new Error(`No image in Fal response: ${text.slice(0, 300)}`);
  return imageUrl;
}

async function downloadAndUploadFalImage(base44, falImageUrl) {
  const res = await fetch(falImageUrl, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`Failed to download generated image (${res.status})`);
  const blob = await res.blob();
  const contentType = blob.type || 'image/jpeg';
  const ext = contentType.includes('png') ? 'png' : 'jpg';
  const file = new File([blob], `output.${ext}`, { type: contentType });
  const result = await base44.asServiceRole.integrations.Core.UploadPublicFile({ file });
  return result?.file_url;
}

async function generateImage(base44, allPhotoUrls, prompt) {
  const personCount = allPhotoUrls.length;
  let falImageUrl;

  if (personCount === 1) {
    // Solo: FLUX.1 Kontext edits the user's photo while preserving their identity.
    assertSafeImageUrl(allPhotoUrls[0]);
    const editPrompt = `Keep the person's face, identity, and features exactly the same. Transform this photo so: ${prompt}`;
    console.log('[generate] Kontext edit for 1 person...');
    falImageUrl = await callFalSync(MODEL_SOLO, {
      prompt: editPrompt,
      image_url: allPhotoUrls[0],
      num_images: 1,
      output_format: 'jpeg',
      safety_tolerance: '2',
    });
  } else {
    // Partners / group: text-to-image generates the multi-person scene.
    console.log(`[generate] Flux text-to-image for ${personCount} people...`);
    falImageUrl = await callFalSync(MODEL_MULTI, {
      prompt,
      num_images: 1,
      output_format: 'jpeg',
      safety_tolerance: '2',
      image_size: 'landscape_4_3',
    });
  }

  console.log('[generate] Downloading and re-uploading generated image...');
  const url = await downloadAndUploadFalImage(base44, falImageUrl);
  if (!url) throw new Error('Failed to upload generated image');
  return url;
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default async function(req) {
  console.log('transformPhoto invoked');

  if (!FAL_API_KEY) {
    return Response.json({
      error: 'AI service is not configured. Please set FAL_API_KEY in your app secrets.',
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
    provider: 'fal',
  });

  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
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
      url = await generateImage(base44, allUrls, prompt);
    } catch (genError) {
      await refundCredits(base44, user.email, creditCheck.deducted);

      const msg = genError.message.toLowerCase();
      if (msg.includes('safety') || msg.includes('nsfw') || msg.includes('blocked')) {
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
      userMessage = 'AI service authentication failed. Please check your FAL_API_KEY.';
    } else if (error.message.includes('429') || error.message.toLowerCase().includes('quota')) {
      userMessage = 'AI service rate limit reached. Please try again in a moment.';
    } else if (error.message.includes('timed out')) {
      userMessage = 'Image generation took too long. Please try again.';
    }

    return Response.json({ error: userMessage, raw_error: error.message }, { status: 500 });
  }
}