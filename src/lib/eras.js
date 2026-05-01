export const ERAS = [
  {
    id: 'ancient_egypt',
    label: 'Ancient Egypt',
    period: '3000 BC',
    image: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=400&q=80',
    prompt: 'Transform this person into an ancient Egyptian pharaoh or queen, wearing golden headdress, kohl eyeliner, ornate collar necklace, standing in front of pyramids and desert landscape, cinematic lighting, photorealistic'
  },
  {
    id: 'roman_empire',
    label: 'Roman Empire',
    period: '27 BC – 476 AD',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&q=80',
    prompt: 'Transform this person into a Roman senator or empress, wearing a white toga with purple trim, laurel wreath crown, marble columns and Roman forum in background, dramatic lighting, photorealistic'
  },
  {
    id: 'medieval',
    label: 'Medieval Knight',
    period: '500 – 1500 AD',
    image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400&q=80',
    prompt: 'Transform this person into a medieval knight or noble, wearing ornate plate armor or royal gown, in a grand castle hall with stained glass windows, candlelight, photorealistic'
  },
  {
    id: 'renaissance',
    label: 'Renaissance',
    period: '1400 – 1600',
    image: 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=400&q=80',
    prompt: 'Transform this person into a Renaissance era portrait painting style, wearing elaborate period clothing with ruffled collar, oil painting aesthetic like Leonardo da Vinci or Raphael, rich warm tones'
  },
  {
    id: 'pirate',
    label: 'Golden Age Pirate',
    period: '1650 – 1730',
    image: 'https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=400&q=80',
    prompt: 'Transform this person into a swashbuckling pirate captain, wearing tricorn hat, leather coat, standing on a ship deck with ocean and sunset behind, cinematic adventure movie style, photorealistic'
  },
  {
    id: 'victorian',
    label: 'Victorian Era',
    period: '1837 – 1901',
    image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80',
    prompt: 'Transform this person into a Victorian era gentleman or lady, wearing top hat or corseted gown with bustle, monocle or parasol, in a grand Victorian parlor, sepia tones, photorealistic'
  },
  {
    id: 'roaring_20s',
    label: 'Roaring 20s',
    period: '1920s',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80',
    prompt: 'Transform this person into a 1920s jazz age character, wearing art deco flapper dress or pinstripe suit with fedora, in a glamorous speakeasy with golden lights, vintage photography style'
  },
  {
    id: 'cyberpunk',
    label: 'Cyberpunk Future',
    period: '2077',
    image: 'https://images.unsplash.com/photo-1514543250502-95b20c7b9f15?w=400&q=80',
    prompt: 'Transform this person into a cyberpunk character, with neon face paint, futuristic tech implants, holographic clothing, in a neon-lit dystopian city at night, blade runner aesthetic, photorealistic'
  },
  {
    id: 'space',
    label: 'Space Explorer',
    period: '2150',
    image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&q=80',
    prompt: 'Transform this person into a space explorer astronaut, wearing a sleek futuristic spacesuit with helmet visor reflecting stars, floating near a space station with Earth visible below, cinematic sci-fi, photorealistic'
  },
  {
    id: 'anime',
    label: 'Anime Hero',
    period: 'Fantasy',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80',
    prompt: 'Transform this person into an anime character, in dramatic Japanese anime art style, dynamic pose with flowing hair, vibrant colors, cherry blossoms or energy effects around them, studio quality anime illustration'
  },
  {
    id: 'greek_myth',
    label: 'Greek Mythology',
    period: 'Timeless',
    image: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=400&q=80',
    prompt: 'Transform this person into a Greek god or goddess on Mount Olympus, wearing flowing white robes with golden accessories, dramatic sky with lightning, marble temple in background, epic and majestic, photorealistic'
  },
  {
    id: 'wild_west',
    label: 'Wild West',
    period: '1850 – 1900',
    image: 'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=400&q=80',
    prompt: 'Transform this person into a Wild West cowboy or cowgirl, wearing a wide-brimmed hat, leather duster coat, bandana, standing in a dusty western town with saloon doors, golden hour sunset, cinematic western movie style'
  },
  {
    id: 'viking',
    label: 'Viking Warrior',
    period: '793 – 1066 AD',
    image: 'https://images.unsplash.com/photo-1531722569936-825d4eaf5a47?w=400&q=80',
    prompt: 'Transform this person into a fierce Norse Viking warrior, wearing a horned helmet, fur-lined armor, braided hair and beard, holding an axe, standing on a longship with stormy fjords in the background, cinematic epic lighting, photorealistic'
  },
  {
    id: 'feudal_japan',
    label: 'Feudal Japan',
    period: '1185 – 1868',
    image: 'https://images.unsplash.com/photo-1490761668535-35497054764e?w=400&q=80',
    prompt: 'Transform this person into a noble samurai or geisha in feudal Japan, wearing ornate silk kimono or full samurai armor with kabuto helmet, cherry blossom trees and a traditional pagoda in the background, painterly cinematic style, photorealistic'
  },
  {
    id: 'aztec',
    label: 'Aztec Empire',
    period: '1300 – 1521',
    image: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=400&q=80',
    prompt: 'Transform this person into an Aztec warrior or priestess, wearing elaborate feathered headdress, jade jewelry, painted body art, standing atop a grand pyramid temple under a blazing sun, epic cinematic lighting, photorealistic'
  },
  {
    id: 'prohibition',
    label: 'Prohibition Era',
    period: '1920s Gangster',
    image: 'https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?w=400&q=80',
    prompt: 'Transform this person into a 1920s prohibition-era gangster or mob boss, wearing a sharp pinstripe double-breasted suit, fedora hat, pocket square, standing in a dimly lit speakeasy with smoky atmosphere and jazz musicians in the background, noir cinematic style'
  },
  {
    id: 'ancient_china',
    label: 'Imperial China',
    period: '221 BC – 1912',
    image: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400&q=80',
    prompt: 'Transform this person into an Imperial Chinese emperor or empress, wearing richly embroidered dragon robes, ornate golden crown, standing in the Forbidden City courtyard with red lacquered columns, cinematic golden lighting, photorealistic'
  },
  {
    id: 'swinging_60s',
    label: 'Swinging 60s',
    period: '1960s',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80',
    prompt: 'Transform this person into a 1960s mod fashion icon, wearing bold geometric patterns, go-go boots or a sharp suit, with a psychedelic pop art background and neon colors, vintage film photography aesthetic'
  },
  {
    id: 'post_apocalyptic',
    label: 'Post-Apocalyptic',
    period: '2150',
    image: 'https://images.unsplash.com/photo-1500916434205-0c77489c6cf7?w=400&q=80',
    prompt: 'Transform this person into a post-apocalyptic survivor, wearing scavenged armor made from car parts and leather straps, face paint and battle scars, standing in a wasteland with ruined skyscrapers and a red stormy sky, Mad Max style cinematic, photorealistic'
  },
  {
    id: 'steampunk',
    label: 'Steampunk',
    period: 'Alternate 1800s',
    image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400&q=80',
    prompt: 'Transform this person into a steampunk inventor or airship captain, wearing brass goggles, Victorian coat with clockwork gears, leather straps with mechanical gadgets, standing in a steam-filled workshop with dirigibles visible through the window, cinematic photorealistic'
  },
  {
    id: 'ancient_india',
    label: 'Mughal Empire',
    period: '1526 – 1857',
    image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&q=80',
    prompt: 'Transform this person into a Mughal emperor or royal princess, wearing richly jeweled silk robes, ornate turban or dupatta with pearls and rubies, seated in an opulent palace with marble archways and reflecting pools, cinematic warm golden lighting, photorealistic'
  },
  {
    id: 'disco',
    label: 'Disco Era',
    period: '1970s',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
    prompt: 'Transform this person into a 1970s disco star, wearing a shimmering sequined jumpsuit or platform shoes and bell-bottoms, surrounded by mirror balls and colorful dance floor lights at Studio 54, vintage film grain effect, photorealistic'
  },
  {
    id: 'fantasy_elf',
    label: 'Fantasy Elf',
    period: 'High Fantasy',
    image: 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=400&q=80',
    prompt: 'Transform this person into a high fantasy elven royalty, with pointed ears, ethereal flowing silver robes, glowing magical runes on skin, standing in an enchanted forest with bioluminescent trees and floating lights, epic fantasy art style, photorealistic'
  },
];