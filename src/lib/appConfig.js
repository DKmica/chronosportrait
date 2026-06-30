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
// AdMob IDs are loaded from Vite environment variables (VITE_ADMOB_*).
// Set production values via .env.local or platform environment variables.
// Falls back to Google's official test ad unit IDs (publicly documented):
//   https://developers.google.com/admob/android/test-ads
export const ADMOB_CONFIG = {
  appId: import.meta.env.VITE_ADMOB_APP_ID || "ca-app-pub-3940256099942544~3347511713",
  bannerAdUnitId: import.meta.env.VITE_ADMOB_BANNER_ID || "ca-app-pub-3940256099942544/6300978111",
  interstitialAdUnitId: import.meta.env.VITE_ADMOB_INTERSTITIAL_ID || "ca-app-pub-3940256099942544/1033173712",
  rewardedAdUnitId: import.meta.env.VITE_ADMOB_REWARDED_ID || "ca-app-pub-3940256099942544/5224354917",
};

// ─── Download Filename ───────────────────────
export function getDownloadFilename(eraLabel) {
  const slug = (eraLabel || "portrait").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  return `chronosbooth-${slug}.jpg`;
}