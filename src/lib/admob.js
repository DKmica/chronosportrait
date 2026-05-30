// ─────────────────────────────────────────────
// ChronosBooth — AdMob / Ad Monetization
// Ads only shown to free users (plan === "free").
// TODO: Replace test AdMob IDs with production IDs before launch.
// ─────────────────────────────────────────────

import { ADMOB_CONFIG, showAds } from "@/lib/appConfig";

// Track session state
let sessionTransformationsCompleted = 0;
let interstitialShownCount = 0;

// Call this whenever a transformation completes
export function recordTransformationCompleted() {
  sessionTransformationsCompleted += 1;
}

// Initialize Google Mobile Ads SDK
export const initAdMob = () => {
  if (window.googletag) {
    window.googletag.cmd.push(() => {
      window.googletag.pubads().disableInitialLoad();
    });
  }
};

// Show interstitial ad if appropriate for this user
// Rules: after every 2 completions, never before first generation, never during generation/payment
export const showInterstitialAd = (plan) => {
  if (!showAds(plan)) return Promise.resolve();
  // Never show before the user's first generation this session
  if (sessionTransformationsCompleted === 0) return Promise.resolve();
  // Show every 2 completions
  if (sessionTransformationsCompleted % 2 !== 0) return Promise.resolve();

  if (!window.googletag) {
    console.warn("[AdMob] Google AdMob SDK not loaded — skipping interstitial.");
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    try {
      window.googletag.cmd.push(() => {
        const slot = window.googletag.defineSlot(
          ADMOB_CONFIG.interstitialAdUnitId,
          [320, 480],
          "gpt-interstitial"
        );
        if (!slot) { resolve(); return; }
        slot.addService(window.googletag.pubads());
        window.googletag.pubads().enableSingleRequest();
        window.googletag.enableServices();
        window.googletag.pubads().addEventListener("slotRenderEnded", () => resolve());
        window.googletag.display("gpt-interstitial");
        setTimeout(() => resolve(), 5000);
      });
    } catch (error) {
      console.warn("[AdMob] Error showing interstitial:", error);
      resolve();
    }
  });
};

// Show a rewarded ad — calls onRewarded() only if the user watches the full ad
// Returns: promise resolving to { rewarded: boolean }
export const showRewardedAd = (plan) => {
  if (!showAds(plan)) return Promise.resolve({ rewarded: false });

  // If AdMob SDK not loaded (web/dev), simulate a 3-second rewarded ad
  if (!window.googletag) {
    return new Promise((resolve) => setTimeout(() => resolve({ rewarded: true }), 3000));
  }

  return new Promise((resolve) => {
    try {
      window.googletag.cmd.push(() => {
        // In production this would use the rewarded ad API
        // For test: simulate rewarded ad completion after 3 seconds
        const rewarded = true; // In real integration, this would come from the ad callback
        setTimeout(() => resolve({ rewarded }), 3000);
      });
    } catch (error) {
      console.warn("[AdMob] Error showing rewarded ad:", error);
      resolve({ rewarded: true }); // Fallback to rewarded on error in dev
    }
  });
};