import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TABS = ['Privacy Policy', 'Terms of Service'];

const PRIVACY = `**Last updated: May 2026**

**1. Data We Collect**
We collect your email address, display name, and uploaded photos solely to deliver the Chronos Booth service. Photos are processed by our AI system and stored temporarily for result retrieval.

**2. How We Use Your Data**
Your photos are used exclusively for AI transformation generation. We do not sell, share, or train AI models with your personal images without explicit consent.

**3. Data Retention**
Generated portraits are stored for 30 days. You may delete your account and all associated data at any time via Settings.

**4. Third-Party Services**
We use industry-standard AI image generation services. Images may be transmitted to these services solely for processing purposes under strict data agreements.

**5. Children's Privacy**
Chronos Booth is not intended for users under 13. We do not knowingly collect data from children.

**6. Your Rights**
You have the right to access, correct, or delete your personal data. Contact us at privacy@chronosbooth.app.

**7. Cookies**
We use essential cookies only — for authentication and session management. No advertising or tracking cookies.

**8. Changes**
We'll notify you of material changes to this policy via email or in-app notification.`;

const TERMS = `**Last updated: May 2026**

**1. Acceptance**
By using Chronos Booth, you agree to these Terms. If you disagree, please do not use the app.

**2. Use of Service**
You may use Chronos Booth for personal, non-commercial purposes. You must not use the service to generate harmful, offensive, or illegal content.

**3. Your Content**
You retain ownership of photos you upload. By uploading, you grant us a limited license to process and generate transformations from your photos.

**4. Generated Content**
AI-generated portraits are provided for personal entertainment. We do not guarantee accuracy, and generated content should not be used for identity fraud or deception.

**5. Prohibited Uses**
- Generating images of non-consenting individuals
- Using generated portraits to deceive others
- Attempting to reverse-engineer our AI systems
- Using the service for commercial purposes without a license

**6. Subscriptions and Payments**
Free tier includes 3 daily transformations. Pro plans renew automatically. You may cancel anytime. Refunds are handled per our refund policy.

**7. Limitation of Liability**
Chronos Booth is provided "as is." We are not liable for any indirect or consequential damages arising from your use of the service.

**8. Governing Law**
These terms are governed by the laws of the State of California, USA.

**9. Contact**
For questions: legal@chronosbooth.app`;

function renderMarkdown(text) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**')) {
      return <p key={i} className="font-bold text-foreground mt-4 mb-1">{line.slice(2, -2)}</p>;
    }
    if (line.includes('**')) {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className="text-muted-foreground text-sm leading-relaxed">
          {parts.map((p, j) => j % 2 === 1 ? <strong key={j} className="text-foreground">{p}</strong> : p)}
        </p>
      );
    }
    if (!line.trim()) return <div key={i} className="h-1" />;
    return <p key={i} className="text-muted-foreground text-sm leading-relaxed">{line}</p>;
  });
}

export default function Legal() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);

  return (
    <div className="min-h-screen">
      <div className="px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-display text-xl font-bold text-foreground">Legal</h1>
      </div>

      {/* Tab switcher */}
      <div className="px-5 mb-5">
        <div className="flex rounded-xl bg-muted/50 p-1 gap-1">
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === i ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-12 space-y-1">
        {renderMarkdown(tab === 0 ? PRIVACY : TERMS)}
      </div>
    </div>
  );
}