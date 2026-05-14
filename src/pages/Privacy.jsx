import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const SECTIONS = [
  {
    title: '1. Who We Are',
    body: `ChronosBooth is an AI portrait transformation app. When you use ChronosBooth, we act as the data controller for the personal information you provide.

Contact us with any privacy questions at: dakoenig4@gmail.com`,
  },
  {
    title: '2. What We Collect',
    body: `We collect the following categories of information when you use ChronosBooth:

Account information — your name and email address when you sign up or sign in.

Photos you upload — the face photos you submit to generate AI portraits. You should only upload photos of yourself or people who have given you permission to use their likeness.

Generated content — the AI-transformed portraits and cinematic videos created from your photos. These are stored in your transformation history.

Usage and streak data — how many transformations you have run, your daily streaks, bonus transformations earned, referral activity, and daily challenge completions.

Community content — portraits you choose to share publicly, captions, likes, and comments you post in the community feed. This content is visible to all signed-in users.

Subscription and purchase data — if you upgrade to a Pro plan or purchase credits, we store your subscription status. Payment processing is handled by Stripe; we do not store full card details.

Device and advertising identifiers — if you use the app on Android, AdMob (Google's advertising platform) may collect device identifiers and usage signals to serve ads to free-tier users. See Google's privacy policy for details on how AdMob handles this data.

Referral data — your referral code and any referral code you used when signing up.

Diagnostics — basic error and crash information to help us fix bugs and improve the app.`,
  },
  {
    title: '3. How We Use Your Data',
    body: `We use the information we collect to:

• Generate your AI portrait transformations — your uploaded photos are sent to our AI image generation service solely to produce the transformation you requested.
• Show you your transformation history and gallery.
• Track your daily usage, streaks, and bonus generations.
• Operate the community feed, including displaying your public posts to other users.
• Process payments and manage your subscription or credit balance.
• Send you streak reminders and important account notifications.
• Display relevant advertisements to free-tier users via AdMob.
• Detect and prevent abuse or policy violations.
• Improve the reliability and quality of the service using anonymized diagnostics.

We do not sell your personal data to third parties. We do not use your uploaded photos to train AI models without your explicit consent.`,
  },
  {
    title: '4. Uploaded Photos — Important Notice',
    body: `When you upload a photo to ChronosBooth:

• The photo is transmitted to our AI processing service to generate your portrait.
• You must only upload photos of yourself or people who have given you permission to use their image.
• Do not upload photos of minors without parental consent.
• Do not upload photos you do not have the right to use.

By uploading a photo you confirm you have the necessary rights or permissions to do so.`,
  },
  {
    title: '5. Community Posts',
    body: `If you choose to share a generated portrait to the ChronosBooth community feed, that post — including the portrait image, any caption you add, your display name, and likes and comments — will be visible to all signed-in users of the app.

You can choose not to share any portrait publicly. Community sharing is always optional.`,
  },
  {
    title: '6. Data Retention',
    body: `We retain your data for as long as your account is active or as needed to provide the service.

• Generated portraits and transformation history are stored in your account and can be deleted by you at any time.
• If you delete your account, we will delete your profile, transformation history, and associated data.
• Some data may be retained for a short period in backups before it is fully purged.`,
  },
  {
    title: '7. Third-Party Services',
    body: `ChronosBooth uses the following third-party services to operate:

• AI image generation — your uploaded photos are processed by our AI provider under strict data agreements and are not used for any purpose beyond generating your requested transformation.
• Stripe — for payment processing. Stripe has its own privacy policy.
• Google AdMob — for serving ads to free-tier users. AdMob may collect advertising identifiers from your device.
• Base44 — our application platform, which hosts the app and its database.

We only share data with these services to the extent necessary to deliver the service to you.`,
  },
  {
    title: '8. Children\'s Privacy',
    body: `ChronosBooth is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child has created an account, please contact us so we can delete it.`,
  },
  {
    title: '9. Your Rights',
    body: `You have the right to:

• Access — request a copy of the personal data we hold about you.
• Correction — ask us to correct inaccurate or incomplete data.
• Deletion — request that we delete your account and associated data (see section 10 below).
• Restriction — ask us to restrict processing of your data in certain circumstances.
• Portability — request your data in a machine-readable format where applicable.

To exercise any of these rights, contact us at dakoenig4@gmail.com.`,
  },
  {
    title: '10. Deleting Your Account',
    body: `You can delete your ChronosBooth account at any time. To do so:

• Go to Settings → Delete Account within the app, or
• Visit the account deletion page directly, or
• Email us at dakoenig4@gmail.com with the subject "Delete My Account."

Deleting your account will permanently remove your profile, transformation history, generated images, community posts, referral data, and subscription information.`,
  },
  {
    title: '11. Security',
    body: `We take reasonable technical and organisational measures to protect your data from unauthorised access, loss, or misuse. However, no internet transmission or storage system is 100% secure. If you have concerns about the security of your data, please contact us.`,
  },
  {
    title: '12. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. When we do, we will update the "Last updated" date at the top of this page. If changes are significant, we will notify you via email or an in-app notice.`,
  },
  {
    title: '13. Contact',
    body: `If you have any questions, concerns, or requests related to this Privacy Policy or your personal data, please contact us:

Email: dakoenig4@gmail.com`,
  },
];

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4 flex items-center gap-3 border-b border-border sticky top-0 bg-background/90 backdrop-blur-sm z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-display text-xl font-bold text-foreground">Privacy Policy</h1>
      </div>

      <div className="px-5 pb-16 max-w-2xl mx-auto">
        {/* Last updated */}
        <p className="text-xs text-muted-foreground mt-4 mb-6">Last updated: May 14, 2026</p>

        {/* Intro */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
          This Privacy Policy explains what information ChronosBooth collects, how we use it, and your rights regarding your data. By using ChronosBooth you agree to the practices described here.
        </p>

        {/* Sections */}
        <div className="space-y-8">
          {SECTIONS.map(({ title, body }) => (
            <div key={title}>
              <h2 className="font-display text-base font-bold text-foreground mb-2">{title}</h2>
              <div className="space-y-2">
                {body.split('\n\n').map((para, i) => (
                  <p key={i} className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{para}</p>
                ))}
              </div>
              {/* Inline delete account link */}
              {title === '10. Deleting Your Account' && (
                <Link
                  to="/delete-account"
                  className="inline-block mt-3 text-sm text-primary underline underline-offset-2"
                >
                  Go to account deletion page →
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}