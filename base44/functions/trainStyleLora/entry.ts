import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * "Style LoRA" training — not true LoRA fine-tuning (that requires GPU infra),
 * but instead uses Gemini to deeply analyze the user's 5-10 photos and produce
 * a rich, structured face + style description that is stored and injected into
 * every future prompt for that user, giving dramatically higher identity consistency.
 */

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_TEXT_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const TRAINING_COST = 1;

// ── Credit Helpers ──────────────────────────────────────────────────────────

async function checkAndDeductTrainingCredits(base44, userEmail) {
  const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: userEmail }, '-updated_date');
  const profile = profiles?.[0];
  if (!profile) return { ok: false, error: 'User profile not found', status: 404 };

  const isPro = profile.plan === 'pro_monthly' || profile.plan === 'pro_yearly';
  if (isPro) return { ok: true, profile, deducted: null };

  const bonus = profile.bonus_transformations || 0;
  const credits = profile.credits || 0;

  const update = { total_transformations: (profile.total_transformations || 0) + 1 };
  let deductionType = null;

  if (bonus >= TRAINING_COST) {
    update.bonus_transformations = bonus - TRAINING_COST;
    deductionType = 'bonus';
  } else if (credits >= TRAINING_COST) {
    update.credits = credits - TRAINING_COST;
    deductionType = 'credits';
  } else {
    return {
      ok: false,
      error: 'Insufficient credits to train an AI model. Upgrade to Pro or earn bonus transformations.',
      error_code: 'INSUFFICIENT_CREDITS',
      status: 402,
    };
  }

  await base44.asServiceRole.entities.UserProfile.update(profile.id, update);
  return { ok: true, profile, deducted: { type: deductionType } };
}

async function refundTrainingCredits(base44, userEmail, deducted) {
  if (!deducted) return;
  const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: userEmail }, '-updated_date');
  const profile = profiles?.[0];
  if (!profile) return;

  const refund = { total_transformations: Math.max(0, (profile.total_transformations || 0) - 1) };
  if (deducted.type === 'bonus') {
    refund.bonus_transformations = (profile.bonus_transformations || 0) + TRAINING_COST;
  } else if (deducted.type === 'credits') {
    refund.credits = (profile.credits || 0) + TRAINING_COST;
  }
  await base44.asServiceRole.entities.UserProfile.update(profile.id, refund);
}

// ── Image Helpers ────────────────────────────────────────────────────────────

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

async function analyzePhotosWithGemini(photoUrls) {
  console.log(`[trainStyleLora] Fetching ${photoUrls.length} photos...`);
  const images = await Promise.all(photoUrls.map(url => imageUrlToBase64(url)));

  const parts = [];
  parts.push({
    text: `You are a professional portrait artist and identity analyst. I am uploading ${photoUrls.length} photos of the SAME person taken at different angles, lighting conditions, and contexts. Your job is to produce a comprehensive identity profile for use in AI image generation.\n\nAnalyze ALL ${photoUrls.length} photos carefully and synthesize a consistent, detailed description:\n`
  });

  images.forEach((img, i) => {
    parts.push({ text: `--- Photo ${i + 1} of ${photoUrls.length} ---` });
    parts.push({ inlineData: { mimeType: img.mimeType, data: img.base64 } });
  });

  parts.push({
    text: `\n--- END OF PHOTOS ---\n\nBased on ALL ${photoUrls.length} photos above, produce a JSON response with this exact structure:\n{\n  "face_description": "A highly detailed, exhaustive description of this person's face for AI image generation. Include: exact face shape (oval/round/square/heart/etc), eye color and shape, eyebrow shape and thickness, nose shape and size, lip fullness and shape, chin shape, cheekbone prominence, jaw definition, ear shape, distinctive features (moles, dimples, freckles, scars), skin tone (use specific descriptors like warm beige, olive, medium brown, deep ebony, etc), approximate age range, and any other identifying facial characteristics. Be extremely specific — this text will be used to recreate this person's exact likeness.",\n  "hair_description": "Color, texture (straight/wavy/curly/coily), length, style, density, any highlights or unique features.",\n  "style_summary": "1-2 sentence summary of this person\\'s overall look and most recognizable features for quick reference.",\n  "consistency_notes": "Any key features that are highly consistent across all photos that should always be preserved (e.g. \\'always has a warm smile\\', \\'distinctive strong brows\\', \\'prominent cheekbones\\')."\n}\n\nRespond with ONLY valid JSON. No markdown, no explanation.`
  });

  const res = await fetch(`${GEMINI_TEXT_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        responseModalities: ['TEXT'],
        temperature: 0.2,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      ],
    }),
  });

  const text = await res.text();
  console.log('[gemini] status:', res.status, '| response preview:', text.slice(0, 300));

  if (!res.ok) throw new Error(`Gemini API error ${res.status}: ${text.slice(0, 300)}`);

  const data = JSON.parse(text);
  const candidate = data?.candidates?.[0];

  // Detect safety / content policy blocks
  if (candidate?.finishReason === 'SAFETY' || candidate?.finishReason === 'PROHIBITED_CONTENT' || candidate?.finishReason === 'RECITATION') {
    throw new Error('SAFETY_VIOLATION');
  }

  const rawText = candidate?.content?.parts?.[0]?.text || '';

  // Clean and parse JSON
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse JSON from Gemini response');

  return JSON.parse(jsonMatch[0]);
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  console.log('trainStyleLora invoked');

  let body = {};
  let loraId = null;

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    try {
      const text = await req.text();
      if (text) body = JSON.parse(text);
    } catch (e) {
      console.log('Body parse error:', e.message);
    }

    const { lora_id, photo_urls } = body;
    loraId = lora_id;

    if (!lora_id) return Response.json({ error: 'lora_id is required' }, { status: 400 });
    if (!photo_urls || photo_urls.length < 5) {
      return Response.json({ error: 'At least 5 photos are required for training' }, { status: 400 });
    }
    if (photo_urls.length > 10) {
      return Response.json({ error: 'Maximum 10 photos allowed' }, { status: 400 });
    }

    // ── Credit validation & atomic deduction (before any AI API call) ──
    const creditCheck = await checkAndDeductTrainingCredits(base44, user.email);
    if (!creditCheck.ok) {
      // Mark as failed so the frontend can react
      await base44.asServiceRole.entities.StyleLora.update(lora_id, { status: 'failed' });
      return Response.json({
        error: creditCheck.error,
        error_code: creditCheck.error_code || 'INSUFFICIENT_CREDITS',
      }, { status: creditCheck.status || 402 });
    }

    // Mark as analyzing
    await base44.asServiceRole.entities.StyleLora.update(lora_id, { status: 'analyzing' });

    console.log(`[train] Analyzing ${photo_urls.length} photos for user ${user.email}...`);

    let analysis;
    try {
      analysis = await analyzePhotosWithGemini(photo_urls);
    } catch (analysisError) {
      // Refund credits on failure
      await refundTrainingCredits(base44, user.email, creditCheck.deducted);
      await base44.asServiceRole.entities.StyleLora.update(lora_id, { status: 'failed' });

      if (analysisError.message === 'SAFETY_VIOLATION' || analysisError.message.toLowerCase().includes('safety')) {
        return Response.json({
          error: 'One or more photos were blocked by safety filters. Please use appropriate photos.',
          error_code: 'SAFETY_VIOLATION',
        }, { status: 400 });
      }
      throw analysisError;
    }

    console.log('[train] Analysis complete:', JSON.stringify(analysis).slice(0, 200));

    // Save the results
    await base44.asServiceRole.entities.StyleLora.update(lora_id, {
      status: 'ready',
      face_description: analysis.face_description,
      style_summary: analysis.style_summary,
      training_photo_urls: photo_urls,
    });

    return Response.json({
      success: true,
      style_summary: analysis.style_summary,
      face_description: analysis.face_description,
    });

  } catch (error) {
    console.error('[error] trainStyleLora:', error.message);

    // Mark as failed if we have the lora_id (saved before the try block)
    if (loraId) {
      try {
        const base44 = createClientFromRequest(req);
        await base44.asServiceRole.entities.StyleLora.update(loraId, { status: 'failed' });
      } catch (_) {}
    }

    return Response.json({ error: error.message }, { status: 500 });
  }
});