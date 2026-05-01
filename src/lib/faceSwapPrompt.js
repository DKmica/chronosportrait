/**
 * Builds a precise face-swap prompt that instructs the AI to:
 * 1. Analyze and lock in the subject's exact facial geometry, features, and expression
 * 2. Blend only costume, background, lighting, and style — never the face structure
 */

export const FACE_PRESERVATION_PREFIX = `CRITICAL FACE-SWAP INSTRUCTIONS:
Perform a precise face-swap transformation. 
- Meticulously preserve the EXACT facial features of the person in the reference image: face shape, bone structure, eye color and shape, nose shape, mouth shape, lip fullness, skin tone, eyebrow shape, and natural expression.
- The subject's face must be IDENTICAL to the input photo — only the costume, hairstyle, background, and lighting should change to match the target era.
- Do NOT alter facial proportions, do NOT smooth skin excessively, do NOT change eye color or facial structure.
- The result must be immediately recognizable as the same person.
- High-fidelity portrait, photorealistic, 8K detail on face.
`;

/**
 * Wraps any era prompt with the face-preservation prefix.
 * @param {string} eraPrompt - The base era transformation prompt
 * @param {string} [styleSuffix] - Optional style modifier
 * @returns {string}
 */
export function buildFaceSwapPrompt(eraPrompt, styleSuffix = '') {
  return `${FACE_PRESERVATION_PREFIX}\n\nERA TRANSFORMATION:\n${eraPrompt}\n\n${styleSuffix}`.trim();
}

/**
 * For group/couples mode — same face-preservation but for multiple subjects.
 * @param {string} modePrefix
 * @param {string} eraPrompt
 * @param {string} [styleSuffix]
 * @returns {string}
 */
export function buildGroupFaceSwapPrompt(modePrefix, eraPrompt, styleSuffix = '') {
  const multiPrefix = `CRITICAL FACE-SWAP INSTRUCTIONS:
Perform a precise multi-person face-swap transformation.
- Preserve the EXACT facial features of EVERY person in the reference images: their individual face shapes, eye colors, nose shapes, skin tones, and expressions must remain identical.
- Each person must be immediately recognizable as themselves.
- Only costumes, hairstyles, background, and lighting change to match the target era.
- Keep all faces high-fidelity and photorealistic, 8K detail.
`;
  return `${multiPrefix}\n${modePrefix}\nERA TRANSFORMATION:\n${eraPrompt}\n\n${styleSuffix}`.trim();
}