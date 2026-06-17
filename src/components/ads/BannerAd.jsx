/**
 * BannerAd — shows a real banner ad for free users only.
 * Uses Google Ad Manager / googletag for web.
 * On mobile (no googletag), shows a minimal placeholder so layout doesn't collapse.
 * Usage: <BannerAd plan={userProfile?.plan} />
 */
import React, { useEffect, useRef } from 'react';
import { showAds, ADMOB_CONFIG } from '@/lib/appConfig';

const BANNER_SLOT_ID = 'chronosbooth-banner-slot';

export default function BannerAd({ plan, className = '' }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!showAds(plan) || initialized.current) return;
    if (!window.googletag) return;

    initialized.current = true;

    window.googletag.cmd.push(() => {
      const slot = window.googletag.defineSlot(
        ADMOB_CONFIG.bannerAdUnitId,
        [320, 50],
        BANNER_SLOT_ID
      );
      if (!slot) return;
      slot.addService(window.googletag.pubads());
      window.googletag.pubads().enableSingleRequest();
      window.googletag.enableServices();
      window.googletag.display(BANNER_SLOT_ID);
    });
  }, [plan]);

  if (!showAds(plan)) return null;

  const hasGoogleTag = typeof window !== 'undefined' && window.googletag;

  return (
    <div className={`w-full flex items-center justify-center rounded-xl my-2 ${className}`} style={{ minHeight: 60 }}>
      <div className="flex flex-col items-center gap-0.5 py-1 px-4 w-full">
        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">Advertisement</p>
        {hasGoogleTag ? (
          <div id={BANNER_SLOT_ID} style={{ width: 320, height: 50 }} />
        ) : (
          <div className="w-full h-[50px] bg-muted/30 rounded-lg flex items-center justify-center">
            <span className="text-xs text-muted-foreground/40 italic">Ad space</span>
          </div>
        )}
      </div>
    </div>
  );
}