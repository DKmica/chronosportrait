/**
 * Unified prompt builder for all Chronos Booth image generation flows.
 * Single source of truth — used by solo, couples, group, kids, pet, custom, and retry modes.
 */

// ── Layout instructions per person count ──────────────────────────────────

function getLayoutInstruction(personCount) {
  switch (personCount) {
    case 1:
      return 'Create a centered solo portrait. The person faces the camera or slight three-quarter angle. Face fully visible.';
    case 2:
      return 'Create a balanced two-person portrait. Person 1 on the left, Person 2 on the right. Both faces equally visible and recognizable.';
    case 3:
      return 'Create a triangle group portrait. Person 1 in the center, Person 2 on the left, Person 3 on the right. All three faces fully visible.';
    case 4:
      return 'Create a four-person portrait with two people in front and two slightly behind. Person 1 front left, Person 2 front right, Person 3 back left, Person 4 back right. All faces visible and unobstructed.';
    case 5:
      return 'Create a five-person cinematic cast portrait. Person 1 center, Person 2 left-center, Person 3 right-center, Person 4 far left, Person 5 far right. All faces visible, sharp, and equally important.';
    case 6:
      return 'Create a six-person formal group portrait with three people in front and three people behind. Person 1 front center, Person 2 front left, Person 3 front right, Person 4 back left, Person 5 back center, Person 6 back right. All six faces fully visible and recognizable.';
    default:
      return 'Create a cinematic group portrait. All people must be clearly visible from at least the chest up. All faces must be sharp and recognizable.';
  }
}

// ── Person map string builder ──────────────────────────────────────────────

function buildPersonMap(personCount) {
  const lines = [];
  for (let i = 1; i <= personCount; i++) {
    lines.push(`- Person ${i} = the face in "PERSON ${i} OF ${personCount}" reference image`);
  }
  return lines.join('\n');
}

// ── Core unified prompt builder ────────────────────────────────────────────

/**
 * THE single prompt builder used by ALL generation flows.
 *
 * @param {Object} options
 * @param {number} options.personCount      - Total number of people (1–6)
 * @param {string} options.eraLabel         - Display label for the era/scenario
 * @param {string} options.eraPrompt        - Detailed era/scenario description
 * @param {string} [options.extraContext]   - Optional mode-specific context (couples vibe, kids safety, etc.)
 * @param {boolean} [options.isRetry]       - Whether this is a retry generation
 */
export function buildPrompt({ personCount, eraLabel, eraPrompt = '', extraContext = '', isRetry = false }) {
  const personMap = buildPersonMap(personCount);
  const layoutInstruction = getLayoutInstruction(personCount);

  const retryPrefix = isRetry
    ? `RETRY NOTICE: The previous generation may have missed or changed a face. This retry must strictly include all ${personCount} uploaded ${personCount === 1 ? 'person' : 'people'} exactly once, with every face fully visible and recognizable.\n\n`
    : '';

  const extraBlock = extraContext ? `\n${extraContext}\n` : '';
  const eraPromptBlock = eraPrompt ? `\n${eraPrompt}\n` : '';

  return `${retryPrefix}Create a cinematic ${eraLabel} portrait using the uploaded reference images.

There are exactly ${personCount} ${personCount === 1 ? 'person' : 'people'}.

REFERENCE MAP:
${personMap}

Use every uploaded person exactly once.
The final image must contain exactly ${personCount} ${personCount === 1 ? 'person' : 'people'} total.
Do not add extra people.
Do not omit anyone.
Do not duplicate anyone.
Do not merge faces.
Do not swap identities.
Do not replace anyone with a generic face.

Preserve each person's recognizable identity from their assigned reference image:
face shape, eyes, nose, mouth, jawline, skin tone, age range, hairstyle, facial hair, and unique features.
${extraBlock}
Composition:
${layoutInstruction}

Every face must be fully visible, sharp, well-lit, and recognizable.
No face may be covered by hats, helmets, masks, shadows, hair, hands, smoke, props, weapons, or another person.
No one should be turned away, hidden, cropped, blurred, or placed far in the background.

Dress everyone in authentic ${eraLabel} clothing.${eraPromptBlock}
The clothing, setting, lighting, and props should match the era, but facial likeness is the highest priority.

Style:
Cinematic realism, professional lighting, high-resolution, sharp facial detail, realistic skin texture, polished movie-poster quality.

Negative instructions:
No missing people.
No extra people.
No duplicated people.
No merged faces.
No identity swaps.
No generic faces.
No hidden faces.
No cropped faces.
No profile-only faces.
No blurry faces.
No distorted faces.
No text or watermark.`.trim();
}

// ── Convenience wrappers ────────────────────────────────────────────────────

/** Solo portrait (1 person). */
export function buildFaceSwapPrompt(eraPrompt, eraLabel = 'Selected Era') {
  return buildPrompt({ personCount: 1, eraLabel, eraPrompt });
}

/**
 * Couples / partners portrait (2 people).
 * Gender-neutral — no role assumptions.
 */
export function buildPartnersPrompt({ eraPrompt, eraLabel = 'Selected Era', relationshipVibe = 'partners', styleA = '', styleB = '', customStyleA = '', customStyleB = '' }) {
  const personADesc = customStyleA || (styleA && styleA !== 'default' ? `${styleA}-style era-appropriate attire` : 'era-appropriate attire');
  const personBDesc = customStyleB || (styleB && styleB !== 'default' ? `${styleB}-style era-appropriate attire` : 'era-appropriate attire');

  const extraContext = `COUPLES CONTEXT:
Person 1 and Person 2 are ${relationshipVibe.toLowerCase()}.
Create a warm, cinematic portrait of these two uploaded people as a pair.
Preserve both identities equally. Do not assign gender roles.
Person 1 wears ${personADesc}.
Person 2 wears ${personBDesc}.
Both people must be clearly and equally visible side by side in the same cohesive scene.
Both people must have anatomically correct and proportional heads relative to their bodies.`;

  return buildPrompt({ personCount: 2, eraLabel, eraPrompt, extraContext });
}

/**
 * Group portrait (2–6 people).
 */
export function buildGroupPrompt({ eraPrompt, eraLabel = 'Selected Era', count = 2, isRetry = false }) {
  return buildPrompt({ personCount: count, eraLabel, eraPrompt, isRetry });
}

/**
 * Kids scenario portrait (1 child).
 */
export function buildKidsPrompt({ scenarioPrompt, scenarioLabel = 'Kids Adventure' }) {
  return buildPrompt({
    personCount: 1,
    eraLabel: scenarioLabel,
    eraPrompt: scenarioPrompt,
    extraContext: 'CHILD SAFETY: This is a child. The scene must be child-safe, whimsical, and colorful. Never depict violence, adult themes, weapons, or inappropriate content.',
  });
}

/**
 * Pet scenario portrait (1 pet).
 * Pets are not people — uses a simplified non-person prompt.
 */
export function buildPetPrompt({ scenarioPrompt, scenarioLabel = 'Pet Portrait' }) {
  return `You are creating a cinematic AI transformation portrait of a pet animal.

CRITICAL IDENTITY LOCK:
This is a specific pet animal from the uploaded reference photo.
Preserve this exact animal's appearance: breed, color, fur/feather/scale pattern, size, markings, and unique features.
Do not replace this animal with a generic or different animal.
Only change attire, accessories, setting, and background to match the scenario.

SCENE: ${scenarioLabel}
${scenarioPrompt}

OUTPUT QUALITY:
High-resolution. Sharp fur/feather detail. Realistic texture. Professional cinematic lighting.
No text, watermark, or logo.`.trim();
}