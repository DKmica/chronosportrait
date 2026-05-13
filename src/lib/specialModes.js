// Modes that require watching an ad (free tier) or pro plan
export const AD_GATED_MODES = ['partners'];

export const SPECIAL_MODES = [
  {
    id: 'partners',
    label: 'Couples & Partners',
    emoji: '🤝',
    description: 'Two people together — partners, friends, siblings, or any pairing',
    promptPrefix: '', // handled by buildPartnersPrompt
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

// Relationship vibe options for partners mode
export const RELATIONSHIP_VIBES = [
  { id: 'partners', label: 'Partners', emoji: '🤝' },
  { id: 'spouses', label: 'Spouses', emoji: '💍' },
  { id: 'dating', label: 'Dating', emoji: '💕' },
  { id: 'best_friends', label: 'Best Friends', emoji: '👫' },
  { id: 'siblings', label: 'Siblings', emoji: '👨‍👩‍👦' },
  { id: 'custom', label: 'Custom', emoji: '✏️' },
];

// Style options for each person in partners mode
export const PARTNER_STYLES = [
  { id: 'royal', label: 'Royal', emoji: '👑' },
  { id: 'warrior', label: 'Warrior', emoji: '⚔️' },
  { id: 'noble', label: 'Noble', emoji: '🎩' },
  { id: 'explorer', label: 'Explorer', emoji: '🗺️' },
  { id: 'rebel', label: 'Rebel', emoji: '🔥' },
  { id: 'mystic', label: 'Mystic', emoji: '🔮' },
  { id: 'scientist', label: 'Scientist', emoji: '🔬' },
  { id: 'artist', label: 'Artist', emoji: '🎨' },
  { id: 'custom', label: 'Custom', emoji: '✏️' },
];