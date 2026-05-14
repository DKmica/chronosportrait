/**
 * Multi-person-safe prompt system for Chronos Booth era transformations.
 * Supports 1–6 people with strict identity preservation.
 */

// ── Layout instructions per person count ──────────────────────────────────

function getLayoutInstruction(personCount) {
  switch (personCount) {
    case 1:
      return 'Create a centered solo portrait with the person facing the camera, face fully visible.';
    case 2:
      return 'Create a balanced two-person portrait. Person 1 on the left, Person 2 on the right. Both faces must be equally visible and recognizable.';
    case 3:
      return 'Create a triangle group composition. Person 1 in the center, Person 2 on the left, Person 3 on the right. All three faces must be fully visible.';
    case 4:
      return 'Create a four-person group portrait with two people in front and two people slightly behind. Person 1 front left, Person 2 front right, Person 3 back left, Person 4 back right. All faces must be visible and unobstructed.';
    case 5:
      return 'Create a five-person cinematic cast portrait. Person 1 center, Person 2 left-center, Person 3 right-center, Person 4 far left, Person 5 far right. All faces must be visible, sharp, and equally important.';
    case 6:
      return 'Create a six-person formal group portrait with three people in front and three people behind. Person 1 front center, Person 2 front left, Person 3 front right, Person 4 back left, Person 5 back center, Person 6 back right. All six faces must be fully visible, sharp, and recognizable.';
    default:
      return 'Create a cinematic group portrait. All people must be clearly visible from at least the chest up. All faces must be sharp and recognizable.';
  }
}

// ── Person map string builder ──────────────────────────────────────────────

function buildPersonMap(personCount) {
  const lines = [];
  for (let i = 1; i <= personCount; i++) {
    lines.push(`Person ${i} = Reference Image ${i} (uploaded photo #${i})`);
  }
  return lines.join('\n');
}

// ── Core multi-person identity-safe prompt ─────────────────────────────────

/**
 * Build a universal multi-person identity-preservation prompt.
 * Works for 1–6 people, couples, group, solo, kids, pet, etc.
 *
 * @param {Object} options
 * @param {number} options.personCount - Total number of people (1–6)
 * @param {string} options.eraLabel - Display label for the era/scenario
 * @param {string} options.eraPrompt - Detailed era/scenario prompt text
 * @param {string} [options.styleSuffix] - Optional extra style instructions
 * @param {string} [options.extraInstructions] - Optional additional instructions (e.g. retry hint)
 */
export function buildMultiPersonPrompt({ personCount, eraLabel, eraPrompt, styleSuffix = '', extraInstructions = '' }) {
  const personMap = buildPersonMap(personCount);
  const layoutInstruction = getLayoutInstruction(personCount);

  return `You are creating a cinematic AI transformation portrait using uploaded reference images.

CRITICAL IDENTITY LOCK:
There are exactly ${personCount} real ${personCount === 1 ? 'person' : 'people'} provided as reference images.
The final image must contain exactly ${personCount} ${personCount === 1 ? 'person' : 'people'} total.
Use every uploaded person exactly once.
Do not omit anyone.
Do not add extra people.
Do not duplicate any person.
Do not merge two people into one face.
Do not swap identities between people.
Do not invent generic faces.
Do not replace uploaded people with random characters.

REFERENCE IMAGE MAP:
${personMap}

IDENTITY PRESERVATION:
For each person, preserve their recognizable facial identity from their assigned reference image, including:
- facial structure
- eye shape
- nose
- mouth
- jawline
- skin tone
- age range
- hairstyle or closest era-appropriate version
- facial hair
- unique recognizable features
- overall likeness

The faces are the highest priority. The era, clothing, background, lighting, and cinematic style are secondary.

SCENE:
Transform all uploaded ${personCount === 1 ? 'person' : 'people'} into the selected era/scenario:
${eraLabel}

${eraPrompt}

COMPOSITION RULES:
Create a staged cinematic ${personCount === 1 ? 'portrait' : 'group portrait'}.
Every person must be clearly visible from at least the chest up.
Every face must be sharp, recognizable, unobstructed, and well-lit.
No face may be hidden by another person, hats, helmets, masks, hair, hands, smoke, props, weapons, shadows, or cropping.
All people should face the camera or use a slight three-quarter pose.
Do not use profile-only poses.
Do not place anyone too far in the background.
Do not blur any face.

GROUP LAYOUT:
${layoutInstruction}

ERA AND COSTUME:
Dress each person in authentic clothing for ${eraLabel}.
Adapt clothing, setting, lighting, and props to the era, but never cover or alter the faces.
Keep the image cinematic, polished, realistic, and high-resolution.

OUTPUT QUALITY:
High-resolution image.
Sharp facial detail.
Realistic skin texture.
Professional cinematic lighting.
Balanced composition.
No distorted faces.
No extra limbs.
No malformed hands near faces.
No text, watermark, logo, UI, or caption inside the image.

NEGATIVE RULES:
Do not create fewer than ${personCount} ${personCount === 1 ? 'person' : 'people'}.
Do not create more than ${personCount} ${personCount === 1 ? 'person' : 'people'}.
Do not hide, crop, blur, replace, duplicate, merge, or heavily alter any uploaded person.
Do not make the people look unrelated to their references.
Do not make one uploaded person appear as multiple people.
Do not create background extras.
${extraInstructions ? `\nADDITIONAL INSTRUCTIONS:\n${extraInstructions}` : ''}
${styleSuffix ? `\nSTYLE:\n${styleSuffix}` : ''}`.trim();
}

// ── Convenience wrappers ────────────────────────────────────────────────────

/**
 * Solo portrait (1 person).
 */
export function buildFaceSwapPrompt(eraPrompt, styleSuffix = '') {
  return buildMultiPersonPrompt({
    personCount: 1,
    eraLabel: 'Selected Era',
    eraPrompt,
    styleSuffix,
  });
}

/**
 * Couples / partners portrait (2 people).
 * Relationship-neutral language — no gender assumptions.
 */
export function buildPartnersPrompt({ eraPrompt, eraLabel = 'Selected Era', relationshipVibe = 'partners', styleA = '', styleB = '', customStyleA = '', customStyleB = '', styleSuffix = '' }) {
  const personADesc = customStyleA || (styleA && styleA !== 'default' ? `dressed in ${styleA}-style era-appropriate attire` : 'in era-appropriate attire');
  const personBDesc = customStyleB || (styleB && styleB !== 'default' ? `dressed in ${styleB}-style era-appropriate attire` : 'in era-appropriate attire');

  const couplesExtra = `COUPLES CONTEXT:
Person 1 and Person 2 are ${relationshipVibe.toLowerCase()}.
Create a romantic/warm cinematic portrait of these two uploaded people as a pair.
Preserve both identities equally. Do not assign gender roles.
Person 1 is ${personADesc}.
Person 2 is ${personBDesc}.
Both people must be clearly and equally visible side by side in the same cohesive scene.
CRITICAL PROPORTIONS: Both people must have anatomically correct and proportional heads relative to their bodies. Head size must be natural and realistic — NOT oversized, NOT too small. Consistent scale and perspective for both figures.`;

  return buildMultiPersonPrompt({
    personCount: 2,
    eraLabel,
    eraPrompt: `${couplesExtra}\n\n${eraPrompt}`,
    styleSuffix,
  });
}

/**
 * Group portrait (2–6 people).
 */
export function buildGroupPrompt({ eraPrompt, eraLabel = 'Selected Era', count = 2, styleSuffix = '', isRetry = false }) {
  const retryHint = isRetry
    ? `Previous generation may have missed or changed a face. This retry must strictly include all ${count} uploaded people exactly once, with every face fully visible and recognizable.`
    : '';

  return buildMultiPersonPrompt({
    personCount: count,
    eraLabel,
    eraPrompt,
    styleSuffix,
    extraInstructions: retryHint,
  });
}

/**
 * Kids scenario portrait (1 child).
 */
export function buildKidsPrompt({ scenarioPrompt, scenarioLabel = 'Kids Adventure' }) {
  return buildMultiPersonPrompt({
    personCount: 1,
    eraLabel: scenarioLabel,
    eraPrompt: `CHILD SAFETY: This is a child. Child-safe, whimsical, colorful scene. Never depict violence, adult themes, or inappropriate content.\n\n${scenarioPrompt}`,
    styleSuffix: 'Child-safe, whimsical, colorful, photorealistic, 8K.',
  });
}

/**
 * Pet scenario portrait (1 pet).
 */
export function buildPetPrompt({ scenarioPrompt, scenarioLabel = 'Pet Portrait' }) {
  // Pets are not people — use a simplified non-person prompt
  return `You are creating a cinematic AI transformation portrait of a pet animal.

CRITICAL IDENTITY LOCK:
This is a specific pet animal from the uploaded reference photo.
Preserve this exact animal's appearance — breed, color, fur/feather/scale pattern, size, markings, and unique features.
Do not replace this animal with a generic or different animal.
Only change attire, accessories, setting, and background to match the scenario.

SCENE: ${scenarioLabel}
${scenarioPrompt}

OUTPUT QUALITY:
High-resolution image. Sharp fur/feather detail. Realistic texture. Professional cinematic lighting. No text, watermark, or logo.`.trim();
}

/**
 * Era-specific prompt templates with full quality parameters.
 */
export const ERA_PROMPT_TEMPLATES = {
  ancient_egypt: {
    setting: 'Ancient Egypt, 3000 BC, temple of Karnak',
    clothing: 'golden headdress, kohl eyeliner, ornate lapis lazuli collar, white linen robe with gold trim',
    lighting: 'warm golden desert sunlight, dramatic side lighting',
    background: 'grand pyramid and Sphinx, hieroglyph-covered walls, desert sands',
    cameraStyle: 'cinematic wide portrait, depth of field, 8K photorealistic',
  },
  viking: {
    setting: 'Norse Viking age, 900 AD, fjords of Scandinavia',
    clothing: 'horned helmet, fur-lined chain mail, leather bracers, wolf-pelt cloak',
    lighting: 'stormy nordic sky, dramatic sidelight, epic atmosphere',
    background: 'longship on stormy fjord, snow-capped mountains',
    cameraStyle: 'cinematic portrait, dramatic lighting, photorealistic',
  },
  cyberpunk: {
    setting: 'Neon-lit dystopian city, year 2077',
    clothing: 'holographic jacket, neon face tech implants, augmented reality visor, glowing circuit tattoos',
    lighting: 'neon blues and purples, rain-soaked reflections',
    background: 'towering megacity, rain, holographic billboards',
    cameraStyle: 'Blade Runner cinematic, anamorphic lens, photorealistic',
  },
};