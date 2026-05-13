// Google AdMob Configuration

export const ADMOB_CONFIG = {
  // Replace these with your actual IDs from Google AdMob
  PUBLISHER_ID: import.meta.env.VITE_ADMOB_PUBLISHER_ID || 'ca-app-pub-xxxxxxxxxxxxxxxx',
  INTERSTITIAL_AD_UNIT_ID: import.meta.env.VITE_ADMOB_INTERSTITIAL_AD_UNIT_ID || 'ca-app-pub-3940256099942544/1033173712',
};

// Initialize Google Mobile Ads SDK
export const initAdMob = () => {
  if (window.googletag) {
    window.googletag.cmd.push(() => {
      window.googletag.pubads().disableInitialLoad();
    });
  }
};

// Load and display interstitial ad
export const showInterstitialAd = () => {
  if (!window.googletag) {
    console.warn('Google AdMob SDK not loaded');
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    try {
      window.googletag.cmd.push(() => {
        const slot = window.googletag.defineSlot(
          ADMOB_CONFIG.INTERSTITIAL_AD_UNIT_ID,
          [320, 480],
          'gpt-interstitial'
        ).addService(window.googletag.pubads());

        window.googletag.pubads().enableSingleRequest();
        window.googletag.enableServices();

        window.googletag.pubads().addEventListener('slotRenderEnded', () => {
          resolve();
        });

        window.googletag.display('gpt-interstitial');

        // Fallback: resolve after 5 seconds if ad doesn't render
        setTimeout(() => resolve(), 5000);
      });
    } catch (error) {
      console.warn('Error showing ad:', error);
      resolve();
    }
  });
};