// Modes that require watching an ad (free tier) or pro plan
export const AD_GATED_MODES = ['partners', 'group'];

export const SPECIAL_MODES = [
  {
    id: 'partners',
    label: 'Couples',
    emoji: '🤝',
    description: 'Two people together — partners, friends, siblings, or any pairing',
    promptPrefix: '',
    eraIds: null,
  },
  {
    id: 'kids',
    label: 'Kids',
    emoji: '🧒',
    description: 'Child-friendly whimsical scenes',
    promptPrefix: '',
    eraIds: null, // uses KID_SCENARIOS
  },
  {
    id: 'pet',
    label: 'Pet',
    emoji: '🐾',
    description: 'Transform your furry friend',
    promptPrefix: '',
    eraIds: null, // uses PET_SCENARIOS
  },
  {
    id: 'group',
    label: 'Group',
    emoji: '👥',
    description: 'Up to 5 people in the same scene',
    promptPrefix: '',
    eraIds: null,
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

// Kid-specific scenarios (10 + custom)
export const KID_SCENARIOS = [
  {
    id: 'fairy_tale',
    label: 'Fairy Tale Kingdom',
    emoji: '🏰',
    prompt: 'Transform this child into a fairy tale character — a prince or princess in a magical kingdom with a glittering castle, enchanted forest, and friendly woodland creatures. Whimsical, colorful, child-appropriate, photorealistic.',
  },
  {
    id: 'superhero',
    label: 'Superhero',
    emoji: '🦸',
    prompt: 'Transform this child into a superhero with a colorful cape and mask, flying above a bright cartoon-style city skyline. Vibrant, fun, empowering, child-appropriate, photorealistic.',
  },
  {
    id: 'dino_explorer',
    label: 'Dino Explorer',
    emoji: '🦕',
    prompt: 'Transform this child into a young dinosaur explorer in a lush prehistoric jungle, wearing a safari hat and khaki outfit, with friendly dinosaurs all around. Adventurous, colorful, child-appropriate, photorealistic.',
  },
  {
    id: 'space_cadet',
    label: 'Space Cadet',
    emoji: '🚀',
    prompt: 'Transform this child into a junior astronaut wearing a cute colorful spacesuit, floating near a friendly spaceship with planets, stars, and a smiling moon in the background. Bright, whimsical, child-appropriate, photorealistic.',
  },
  {
    id: 'pirate_adventure',
    label: 'Pirate Adventure',
    emoji: '🏴‍☠️',
    prompt: 'Transform this child into a fun pirate kid with a small tricorn hat, striped shirt, eyepatch, and a toy treasure map, standing on a colorful pirate ship with calm blue waters and treasure islands. Fun, adventurous, child-appropriate, photorealistic.',
  },
  {
    id: 'wizard',
    label: 'Little Wizard',
    emoji: '🧙',
    prompt: 'Transform this child into a young wizard wearing a starry robe and pointy hat, holding a glowing wand, standing in a magical school library with floating books and glowing spell effects. Enchanting, colorful, child-appropriate, photorealistic.',
  },
  {
    id: 'jungle_explorer',
    label: 'Jungle Explorer',
    emoji: '🌿',
    prompt: 'Transform this child into a brave little jungle explorer with a pith helmet, binoculars, and boots, surrounded by giant tropical plants, colorful parrots, and friendly monkeys. Vibrant, adventurous, child-appropriate, photorealistic.',
  },
  {
    id: 'medieval_knight',
    label: 'Mini Knight',
    emoji: '⚔️',
    prompt: 'Transform this child into an adorable medieval knight wearing shiny small-scale armor, holding a toy sword and shield, standing in front of a friendly fairytale castle with a dragon friend. Fun, heroic, child-appropriate, photorealistic.',
  },
  {
    id: 'underwater',
    label: 'Ocean Adventure',
    emoji: '🐠',
    prompt: 'Transform this child into a little mermaid or underwater explorer in a magical ocean scene with colorful fish, sea turtles, playful dolphins, and a glowing coral reef. Dreamy, colorful, child-appropriate, photorealistic.',
  },
  {
    id: 'wild_west_kid',
    label: 'Little Cowboy',
    emoji: '🤠',
    prompt: 'Transform this child into an adorable little cowboy or cowgirl with a mini hat, boots, and vest, on a friendly horse in a sunny western town with a rainbow in the sky. Cute, adventurous, child-appropriate, photorealistic.',
  },
  {
    id: 'custom',
    label: 'Custom',
    emoji: '✏️',
    prompt: '', // user-provided
  },
];

// Pet-specific scenarios (10 + custom)
export const PET_SCENARIOS = [
  {
    id: 'royal_pet',
    label: 'Royal Pet',
    emoji: '👑',
    prompt: 'Transform this pet into a regal royal animal wearing a tiny velvet crown and jeweled collar, sitting on a golden throne in an opulent palace. Majestic, detailed, photorealistic.',
  },
  {
    id: 'knight_pet',
    label: 'Knight in Armor',
    emoji: '⚔️',
    prompt: 'Transform this pet into a brave knight animal wearing a miniature suit of shining armor with a tiny cape, standing heroically in front of a medieval castle. Epic, cute, photorealistic.',
  },
  {
    id: 'astronaut_pet',
    label: 'Space Pup/Kitty',
    emoji: '🚀',
    prompt: 'Transform this pet into an adorable space explorer wearing a custom pet-sized spacesuit and helmet, floating weightlessly with Earth visible through the window. Cute, futuristic, photorealistic.',
  },
  {
    id: 'pirate_pet',
    label: 'Pirate Pet',
    emoji: '🏴‍☠️',
    prompt: 'Transform this pet into a swashbuckling pirate animal wearing a tiny tricorn hat, eyepatch, and bandana, standing on a ship deck with the ocean and treasure chest behind. Fun, adventurous, photorealistic.',
  },
  {
    id: 'pharaoh_pet',
    label: 'Egyptian Pharaoh',
    emoji: '🐱',
    prompt: 'Transform this pet into an ancient Egyptian deity animal — like the sacred cats or Anubis — adorned with golden collar, kohl markings, and an ornate headdress, sitting before pyramid ruins under desert sky. Majestic, photorealistic.',
  },
  {
    id: 'wizard_pet',
    label: 'Wizard Pet',
    emoji: '🔮',
    prompt: 'Transform this pet into a magical familiar wizard animal wearing a tiny starry wizard hat and robe, surrounded by floating magical sparkles and spell books in an enchanted library. Whimsical, detailed, photorealistic.',
  },
  {
    id: 'superhero_pet',
    label: 'Superhero Pet',
    emoji: '🦸',
    prompt: 'Transform this pet into a superhero animal with a colorful miniature cape and mask, flying above a cityscape with heroic lighting and energy effects. Fun, dynamic, photorealistic.',
  },
  {
    id: 'cowboy_pet',
    label: 'Cowboy Pet',
    emoji: '🤠',
    prompt: 'Transform this pet into a Wild West cowboy animal wearing a tiny stetson hat and bandana, sitting atop a horse or standing in a dusty western town at golden hour. Cute, photorealistic.',
  },
  {
    id: 'samurai_pet',
    label: 'Samurai Pet',
    emoji: '🗡️',
    prompt: 'Transform this pet into a noble samurai animal wearing miniature samurai armor and a kabuto helmet, posed heroically against a backdrop of cherry blossoms and a Japanese pagoda. Epic, photorealistic.',
  },
  {
    id: 'viking_pet',
    label: 'Viking Pet',
    emoji: '🪓',
    prompt: 'Transform this pet into a fierce Viking warrior animal wearing a tiny horned helmet and fur cloak, standing on a longship with dramatic stormy fjords in the background. Epic, photorealistic.',
  },
  {
    id: 'custom',
    label: 'Custom',
    emoji: '✏️',
    prompt: '', // user-provided
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