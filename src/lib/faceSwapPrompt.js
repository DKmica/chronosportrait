/**
 * Builds a precise face-swap prompt that instructs the AI to:
 * 1. Analyze and lock in the subject's exact facial geometry, features, and expression
 * 2. Blend only costume, background, lighting, and style — never the face structure
 */

export const FACE_PRESERVATION_PREFIX = `CRITICAL FACE-SWAP INSTRUCTIONS:
You are given reference photo(s) of real people. Your ONLY job is to re-dress and re-contextualize them — their faces must be pixel-perfect copies from the reference images.
- COPY the exact face from each reference photo: face shape, bone structure, eye color, eye shape, nose, mouth, lips, skin tone, eyebrows, freckles, wrinkles, and any distinguishing features.
- The face in the output MUST be immediately recognizable as the exact same person in the reference photo.
- DO NOT generate a generic or idealized face. DO NOT smooth, beautify, or alter the face in any way.
- DO NOT change eye color. DO NOT change face shape. DO NOT change skin tone.
- ONLY change: clothing/costume, hairstyle, background, lighting, and era-appropriate props.
- Ultra high-fidelity face, photorealistic, 8K detail, exact likeness.
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
  const multiPrefix = `CRITICAL MULTI-PERSON FACE-SWAP INSTRUCTIONS:
You are given multiple reference photos of different real people. Reproduce EVERY person's face with exact fidelity.
- For EACH reference photo provided, copy that person's face EXACTLY into the output: face shape, bone structure, eye color, eye shape, nose, mouth, skin tone, distinguishing marks.
- Place each person side by side in the same scene. Every individual face must be immediately recognizable as the specific person in their reference photo.
- DO NOT merge faces. DO NOT generate generic faces. DO NOT idealize or beautify any face.
- ONLY change: clothing/costume, hairstyle, background, lighting, and era-appropriate props.
- Ultra high-fidelity faces, photorealistic, 8K detail, exact likenesses for all people.
`;
  return `${multiPrefix}\n${modePrefix}\nERA TRANSFORMATION:\n${eraPrompt}\n\n${styleSuffix}`.trim();
}