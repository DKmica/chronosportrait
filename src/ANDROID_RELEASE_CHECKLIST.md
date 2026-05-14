# ChronosBooth — Android (Google Play) Release Checklist

## App Identity
- **App Name:** ChronosBooth
- **Package Name:** com.chronosbooth.app
- **Version Name:** 1.0.0
- **Version Code:** 1
- **Min SDK:** 23 (Android 6.0 Marshmallow)
- **Compile SDK:** 35 (Android 15)
- **Output Format:** Android App Bundle (.aab)

---

## Before Submitting to Google Play

### AdMob
- [ ] Replace test AdMob App ID in `AndroidManifest.xml` with your production App ID
- [ ] Replace `bannerAdUnitId` in `lib/appConfig.js` with production banner unit
- [ ] Replace `interstitialAdUnitId` with production interstitial unit
- [ ] Replace `rewardedAdUnitId` with production rewarded unit
- [ ] Test ads show for free users; confirm NO ads for pro_monthly/pro_yearly

### Icons & Splash
- [ ] Add `/public/icons/icon-192.png` (192×192, round or square)
- [ ] Add `/public/icons/icon-512.png` (512×512, for Play Store listing)
- [ ] Add `/public/icons/icon-maskable-512.png` (512×512, safe area centered, for adaptive icon)
- [ ] Add splash screen background matching `--background: 260 20% 6%` (dark purple)
- [ ] Add `/public/screenshots/home.png` and `/public/screenshots/result.png` for Play listing

### Google Play Store Listing
- [ ] App title: ChronosBooth
- [ ] Short description (≤80 chars): "Step into any era — AI historical portraits for you, couples & crews."
- [ ] Full description: highlight free tier, Pro, eras, couples/group modes
- [ ] Privacy Policy URL: https://chronosbooth.app/legal (or your deployed URL)
- [ ] Support email: support@chronosbooth.app
- [ ] Content rating: Complete questionnaire (photo app, no violence/mature content)
- [ ] Category: Photography or Entertainment
- [ ] Add at least 2 phone screenshots (1080×1920)

### Privacy & Legal
- [ ] Privacy Policy live at a public URL
- [ ] Terms of Service live at a public URL
- [ ] Delete account flow live at /delete-account
- [ ] Support page live at /support
- [ ] Data safety form filled in Play Console:
  - Collects: Email address, Photos (user-provided, not shared/sold)
  - Uses encryption in transit: Yes
  - Deletes data on request: Yes

### Functional Testing Checklist
- [ ] Solo generation — upload 1 photo, pick era, transform
- [ ] Couples generation — upload 2 photos, pick era, transform
- [ ] Group generation — upload 2–6 photos, pick era, transform
- [ ] Failed generation — shows user-friendly error + retry button
- [ ] Download — saves image to device
- [ ] Share — opens native share sheet with watermarked image (free) or clean (pro)
- [ ] Watermark — free users see "Made with ChronosBooth" overlay
- [ ] No watermark — pro users get clean HD image
- [ ] Banner ad — appears for free users on Home and Result pages
- [ ] Interstitial ad — appears after every 2 completions for free users
- [ ] Rewarded ad — grants +1 bonus transformation, max 3/day for free users
- [ ] No ads for pro users (pro_monthly or pro_yearly)
- [ ] Community posts — create, like, comment, report
- [ ] Photo consent banner — shown once, dismissable
- [ ] Offline banner — appears when device has no internet
- [ ] Account deletion — /delete-account page, requires confirmation
- [ ] Safe area — UI respects notch/status bar on all Android devices

### Build (.aab)
When building via Trusted Web Activity (TWA) or Capacitor/Expo:
- [ ] `applicationId = "com.chronosbooth.app"`
- [ ] `versionCode = 1`
- [ ] `versionName = "1.0.0"`
- [ ] `minSdkVersion = 23`
- [ ] `compileSdkVersion = 35`
- [ ] `targetSdkVersion = 35`
- [ ] Sign with upload keystore (keep keystore safe — Google Play requires the same key for all updates)
- [ ] Build release AAB: `./gradlew bundleRelease`
- [ ] Verify AAB with `bundletool`

---

## AndroidManifest.xml Required Additions

```xml
<!-- AdMob App ID (replace with production ID) -->
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-3940256099942544~3347511713"/>

<!-- Internet permission -->
<uses-permission android:name="android.permission.INTERNET"/>

<!-- Camera (for photo capture) -->
<uses-permission android:name="android.permission.CAMERA"/>

<!-- Storage for Android < 13 -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
    android:maxSdkVersion="32"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
    android:maxSdkVersion="28"/>

<!-- Media access for Android 13+ -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES"/>
```

---

## build.gradle (app level)

```groovy
android {
    namespace "com.chronosbooth.app"
    compileSdk 35

    defaultConfig {
        applicationId "com.chronosbooth.app"
        minSdk 23
        targetSdk 35
        versionCode 1
        versionName "1.0.0"
    }

    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}

dependencies {
    // Google Mobile Ads SDK
    implementation 'com.google.android.gms:play-services-ads:23.0.0'
}
```

---

*Generated for ChronosBooth v1.0.0 — com.chronosbooth.app*