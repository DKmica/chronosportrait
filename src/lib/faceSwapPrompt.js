/**
 * Comprehensive prompt system for era transformations.
 * Includes face preservation, era prompts, negative prompts, and partners mode.
 */

export const NEGATIVE_PROMPT =
  'deformed face, wrong identity, merged faces, extra limbs, distorted eyes, bad hands, blurry, cartoonish unless requested, low quality, duplicate person, incorrect face, face swap failure, ugly, mutated, bad anatomy, watermark, text, signature';

export const FACE_PRESERVATION_PREFIX = `CRITICAL IDENTITY-PRESERVATION INSTRUCTIONS:
You are given reference photo(s) of real people. Reproduce EACH person's face with exact pixel fidelity.
- COPY the exact face from each reference photo: face shape, bone structure, eye color, eye shape, nose, mouth, lips, skin tone, eyebrows, freckles, wrinkles, age, and all distinguishing features.
- The face in the output MUST be immediately recognizable as the exact same person in the reference photo.
- DO NOT generate a generic or idealized face. DO NOT smooth, beautify, or alter the face structure in any way.
- DO NOT change eye color. DO NOT change face shape. DO NOT change skin tone. DO NOT change age.
- ONLY change: clothing/costume, hairstyle, background, lighting, and era-appropriate props/accessories.
- Ultra high-fidelity face, photorealistic, 8K detail, exact likeness preserved.
- Negative: ${NEGATIVE_PROMPT}
`;

/**
 * Build a solo transformation prompt.
 */
export function buildFaceSwapPrompt(eraPrompt, styleSuffix = '') {
  return `${FACE_PRESERVATION_PREFIX}\nERA TRANSFORMATION:\n${eraPrompt}\n\n${styleSuffix}`.trim();
}

/**
 * Build an inclusive partners/couples prompt — no gender assumptions.
 * @param {Object} options
 * @param {string} options.eraPrompt
 * @param {string} [options.relationshipVibe] - e.g. 'Partners', 'Best friends', 'Siblings'
 * @param {string} [options.styleA] - style label for Person A
 * @param {string} [options.styleB] - style label for Person B
 * @param {string} [options.customStyleA] - custom prompt override for Person A
 * @param {string} [options.customStyleB] - custom prompt override for Person B
 * @param {string} [options.styleSuffix]
 */
export function buildPartnersPrompt({ eraPrompt, relationshipVibe = 'Partners', styleA = '', styleB = '', customStyleA = '', customStyleB = '', styleSuffix = '' }) {
  const personADesc = customStyleA || (styleA ? `dressed in ${styleA}-style era-appropriate attire` : 'in era-appropriate attire');
  const personBDesc = customStyleB || (styleB ? `dressed in ${styleB}-style era-appropriate attire` : 'in era-appropriate attire');

  return `CRITICAL MULTI-PERSON IDENTITY-PRESERVATION INSTRUCTIONS:
Two reference photos are provided — one per person.
- Person A (from first reference image): copy their face EXACTLY. They are ${personADesc}.
- Person B (from second reference image): copy their face EXACTLY. They are ${personBDesc}.
- Both people are ${relationshipVibe.toLowerCase()} and appear together side by side in the same cohesive scene.
- DO NOT merge their faces. DO NOT swap their identities. Keep every individual DISTINCT and recognizable.
- Preserve each person's: face shape, bone structure, eye color, skin tone, age, and all distinguishing features.
- Show "two people standing together" — each with their own identity, no assumptions about gender or relationship roles.
- ONLY change: clothing/costume, hairstyle, background, lighting, and era-appropriate props.
- CRITICAL PROPORTIONS: Both people must have anatomically correct and proportional heads relative to their bodies. Head size must be natural and realistic — NOT oversized, NOT too small. Both figures must have identical scale and perspective consistency.
- Ultra high-fidelity faces, photorealistic, 8K detail.
- Negative: ${NEGATIVE_PROMPT}, disproportionate head, oversized head, big head, head too large, unequal proportions

ERA TRANSFORMATION:
${eraPrompt}

${styleSuffix}`.trim();
}

/**
 * Legacy group prompt builder (kept for backwards compatibility).
 */
export function buildGroupFaceSwapPrompt(modePrefix, eraPrompt, styleSuffix = '') {
  return `CRITICAL MULTI-PERSON IDENTITY-PRESERVATION INSTRUCTIONS:
Multiple reference photos of different real people are provided.
- For EACH reference photo, copy that person's face EXACTLY into the output.
- Place each person side by side. Every face must be immediately recognizable.
- DO NOT merge faces. DO NOT generate generic faces.
- ONLY change: clothing/costume, hairstyle, background, lighting, and era-appropriate props.
- Ultra high-fidelity faces, photorealistic, 8K detail.
- Negative: ${NEGATIVE_PROMPT}

${modePrefix}
ERA TRANSFORMATION:
${eraPrompt}

${styleSuffix}`.trim();
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