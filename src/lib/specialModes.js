// Modes that require watching an ad (free tier) or pro plan
export const AD_GATED_MODES = ['couples'];

export const SPECIAL_MODES = [
  {
    id: 'couples',
    label: 'Couples',
    emoji: '💑',
    description: 'For two people together',
    promptPrefix: 'Two reference photos are provided — one per person. Each person in the output must have the EXACT face from their corresponding reference photo. Show both together, side by side, romantic and cinematic, with era-appropriate costumes. ',
    eraIds: null,
  },
  {
    id: 'kids',
    label: 'Kids',
    emoji: '🧒',
    description: 'Child-friendly scenes',
    promptPrefix: 'This is a child. Create a whimsical, safe, and child-appropriate transformation. ',
    eraIds: ['medieval', 'ancient_egypt', 'greek_myth', 'anime', 'wild_west', 'space', 'roaring_20s'],
  },
  {
    id: 'pet',
    label: 'Pet',
    emoji: '🐾',
    description: 'Transform your furry friend',
    promptPrefix: 'This is a pet animal. Transform this animal into the chosen era setting, keeping its animal nature but dressing it in era-appropriate attire, cute and detailed. ',
    eraIds: ['ancient_egypt', 'medieval', 'roman_empire', 'victorian', 'wild_west', 'cyberpunk', 'space'],
  },
  {
    id: 'birthday',
    label: 'Birthday',
    emoji: '🎂',
    description: 'Celebratory portrait',
    promptPrefix: 'This is a birthday portrait. Add festive, celebratory elements appropriate to the era — banners, confetti, candles, or period-appropriate decorations. Make it feel like a celebration. ',
    eraIds: null,
  },
];