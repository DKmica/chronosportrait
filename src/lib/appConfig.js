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

// ─── AdMob Config ────────────────────────────
// TODO: Replace test AdMob IDs with production IDs before launch.
export const ADMOB_CONFIG = {
  bannerAdUnitId: "TEST_BANNER_ID",
  interstitialAdUnitId: "TEST_INTERSTITIAL_ID",
  rewardedAdUnitId: "TEST_REWARDED_ID",
};

// ─── Download Filename ───────────────────────
export function getDownloadFilename(eraLabel) {
  const slug = (eraLabel || "portrait").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  return `chronosbooth-${slug}.jpg`;
}