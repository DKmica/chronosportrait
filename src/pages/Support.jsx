import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, MessageCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQS = [
  {
    q: 'How many free transformations do I get per day?',
    a: 'Free users get 3 transformations per day. The counter resets at midnight. You can earn bonus transformations by sharing, watching rewarded ads, or referring friends.',
  },
  {
    q: 'Why did my transformation fail?',
    a: 'For best results use a clear, front-facing photo with good lighting. Avoid sunglasses, heavy filters, hats, collages, screenshots, or group photos. If it still fails, please retry with a different photo.',
  },
  {
    q: 'Can I delete my account and all my data?',
    a: 'Yes. Go to Settings → Delete Account. This will permanently remove your profile, transformations, and all associated data. The action cannot be undone.',
  },
  {
    q: 'How do I cancel my Pro subscription?',
    a: 'Subscriptions are managed through Google Play. Open the Google Play Store → your profile → Payments & subscriptions → Subscriptions, then cancel ChronosBooth. Your Pro access continues until the end of the billing period.',
  },
  {
    q: 'What happens to my photos after transformation?',
    a: 'Uploaded photos and generated portraits are stored for up to 30 days. We never share or sell your photos. You can delete your account at any time to remove all data.',
  },
  {
    q: 'Why do I see ads?',
    a: 'Ads help keep the free tier available. Pro subscribers never see ads. You can also watch a rewarded ad to earn a bonus transformation.',
  },
  {
    q: 'How do rewarded ads work?',
    a: 'Tap "Watch Ad" on the home screen to watch a short video ad. After completing the full ad you earn 1 bonus transformation. Free users can earn up to 3 per day this way.',
  },
  {
    q: 'Is ChronosBooth safe for kids?',
    a: 'ChronosBooth is rated for users 13 and older. We do not knowingly collect data from children under 13.',
  },
];

function FAQItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-muted/20 transition-colors"
      >
        <span className="text-sm font-semibold text-foreground pr-3">{item.q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border"
          >
            <p className="px-4 py-3 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Support() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-display text-xl font-bold text-foreground">Help & Support</h1>
      </div>

      <div className="px-5 space-y-6">
        {/* Contact options */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href="mailto:support@chronosbooth.app"
            className="flex flex-col items-center gap-2 py-5 rounded-2xl border border-border bg-card hover:bg-muted/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">Email Us</span>
            <span className="text-xs text-muted-foreground">support@chronosbooth.app</span>
          </a>
          <a
            href="https://chronosbooth.app/community"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 py-5 rounded-2xl border border-border bg-card hover:bg-muted/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">Community</span>
            <span className="text-xs text-muted-foreground">Join the conversation</span>
          </a>
        </div>

        {/* Policy links */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Legal</h2>
          </div>
          {[
            { label: 'Privacy Policy', url: 'https://chronosbooth.app/legal?tab=privacy' },
            { label: 'Terms of Service', url: 'https://chronosbooth.app/legal?tab=terms' },
          ].map(({ label, url }) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-4 border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
            >
              <span className="text-sm text-foreground">{label}</span>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>
          ))}
        </div>

        {/* FAQs */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {FAQS.map((item, i) => (
              <FAQItem key={i} item={item} />
            ))}
          </div>
        </div>

        {/* App version */}
        <p className="text-center text-xs text-muted-foreground pt-2">ChronosBooth v1.0.0 (1)</p>
      </div>
    </div>
  );
}