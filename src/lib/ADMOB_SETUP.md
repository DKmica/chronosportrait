# Google AdMob Setup Guide

## Step 1: Create a Google AdMob Account
1. Go to https://admob.google.com
2. Sign in with your Google Account
3. Follow the prompts to create your AdMob account
4. Accept the terms and conditions

## Step 2: Get Your Publisher ID
1. In AdMob dashboard, go to **Settings** → **Account Information**
2. Copy your **Publisher ID** (looks like `ca-app-pub-xxxxxxxxxxxxxxxx`)

## Step 3: Create Ad Units
1. Go to **Apps** → **Create App** (or select your app)
2. Click **Create Ad Unit**
3. Select **Interstitial** ad format
4. Name it (e.g., "Transformation Complete")
5. Copy the **Ad Unit ID** (looks like `ca-app-pub-3940256099942544/1033173712`)

## Step 4: Add IDs to Your App
Once you have your Publisher ID and Ad Unit ID:

1. Set them as environment variables in the Base44 dashboard:
   - `ADMOB_PUBLISHER_ID`: Your Publisher ID
   - `ADMOB_INTERSTITIAL_AD_UNIT_ID`: Your Ad Unit ID

2. Or directly update `lib/admob.js` with your IDs

## Step 5: Test Ad Unit IDs (Optional)
For testing before going live, use these test IDs:
- **Interstitial Ad Unit ID**: `ca-app-pub-3940256099942544/1033173712`

These will show test ads and won't affect your account.