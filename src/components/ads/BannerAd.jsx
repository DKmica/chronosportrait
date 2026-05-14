/**
 * BannerAd — shows a banner ad placeholder for free users only.
 * Usage: <BannerAd plan={userProfile?.plan} />
 * Free users see a banner; Pro users see nothing.
 */
import React from 'react';
import { showAds } from '@/lib/appConfig';

export default function BannerAd({ plan, className = '' }) {
  if (!showAds(plan)) return null;

  return (
    <div className={`w-full flex items-center justify-center bg-muted/30 border border-border/50 rounded-xl my-2 ${className}`} style={{ minHeight: 60 }}>
      {/* TODO: Replace with actual AdMob banner — TEST_BANNER_ID */}
      <div className="flex flex-col items-center gap-0.5 py-3 px-4 w-full">
        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">Advertisement</p>
        <div className="w-full h-[50px] bg-muted/50 rounded-lg flex items-center justify-center">
          <span className="text-xs text-muted-foreground/40 italic">Ad</span>
        </div>
      </div>
    </div>
  );
}