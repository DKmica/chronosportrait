// ─────────────────────────────────────────────
// ChronosBooth — Central App Configuration
// Single source of truth for branding, captions, and ad config.
// ─────────────────────────────────────────────

export const APP_NAME = "ChronosBooth";
export const APP_TAGLINE = "The AI Time Machine for You, Couples & Crews";
export const WATERMARK_TEXT = "Made with ChronosBooth";
export const DEFAULT_SHARE_CAPTION = "I made this with ChronosBooth — try yours free.";

// ─── Share Captions ───────────────────────────
export const SHARE_CAPTIONS = {
  solo: "I found my era with ChronosBooth — try yours free.",
  couple: "We transformed into another era with ChronosBooth.",
  group: "My crew became cinematic legends with ChronosBooth.",
  video: "I made this time-travel video with ChronosBooth.",
  default: DEFAULT_SHARE_CAPTION,
};

export function getShareCaption(transformation) {
  if (!transformation) return SHARE_CAPTIONS.default;
  const hasExtra = transformation.extra_photo_urls?.length > 0;
  if (hasExtra && transformation.extra_photo_urls.length >= 2) return SHARE_CAPTIONS.group;
  if (hasExtra) return SHARE_CAPTIONS.couple;
  if (transformation.video_url) return SHARE_CAPTIONS.video;
  return SHARE_CAPTIONS.solo;
}

// ─── Plan Helpers ─────────────────────────────
export function isPro(plan) {
  return plan === "pro_monthly" || plan === "pro_yearly";
}

export function showAds(plan) {
  return !isPro(plan);
}

export function showWatermark(plan) {
  return !isPro(plan);
}

// ─── App Build Info ──────────────────────────
export const APP_PACKAGE = "com.chronosbooth.app";
export const APP_VERSION_NAME = "1.0.0";
export const APP_VERSION_CODE = 1;
export const APP_MIN_SDK = 23;
export const APP_COMPILE_SDK = 35;

// ─── AdMob Config ────────────────────────────
// TODO (before Google Play release):
//   1. Replace TEST app ID with your production AdMob App ID.
//   2. Replace each TEST ad unit ID with your production ad unit IDs.
//   3. Add the production AdMob App ID to AndroidManifest.xml:
//      <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID"
//                 android:value="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"/>
//   Package: com.chronosbooth.app
export const ADMOB_CONFIG = {
  // Production App ID
  appId: "ca-app-pub-2828628272233541~1612335266",

  // Production banner unit
  bannerAdUnitId: "ca-app-pub-2828628272233541/8788993419",

  // Production interstitial unit
  interstitialAdUnitId: "ca-app-pub-2828628272233541/6652613807",

  // Production rewarded unit
  rewardedAdUnitId: "ca-app-pub-2828628272233541/2928991211",
};

// ─── Download Filename ───────────────────────
export function getDownloadFilename(eraLabel) {
  const slug = (eraLabel || "portrait").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  return `chronosbooth-${slug}.jpg`;
}