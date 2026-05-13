import React, { useEffect } from 'react';

export default function InterstitialAd() {
  useEffect(() => {
    // Ensure googletag is available
    if (window.googletag) {
      window.googletag.cmd.push(() => {
        window.googletag.display('gpt-interstitial');
      });
    }
  }, []);

  return <div id="gpt-interstitial" style={{ minHeight: '480px', minWidth: '320px' }} />;
}