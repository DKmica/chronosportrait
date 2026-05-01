import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Clock, Zap, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import PhotoUploader from '@/components/transform/PhotoUploader';
import GroupPhotoUploader from '@/components/transform/GroupPhotoUploader';
import EraCard from '@/components/transform/EraCard';
import CustomEraCard from '@/components/transform/CustomEraCard';
import SpecialModeBar from '@/components/transform/SpecialModeBar';
import TransformingOverlay from '@/components/transform/TransformingOverlay';
import AdGateModal from '@/components/transform/AdGateModal';
import LimitBanner from '@/components/transform/LimitBanner';
import ShareSheet from '@/components/share/ShareSheet';
import { ERAS } from '@/lib/eras';
import { SPECIAL_MODES, AD_GATED_MODES } from '@/lib/specialModes';
import StyleSelector, { STYLE_PROMPTS } from '@/components/transform/StyleSelector';
import { getOrCreateProfile, getRemainingToday, consumeTransformation, FREE_DAILY_LIMIT } from '@/lib/usageLimit';
import { buildFaceSwapPrompt, buildGroupFaceSwapPrompt } from '@/lib/faceSwapPrompt';
import PostGenerationModal from '@/components/referral/PostGenerationModal';

export default function Home() {
  const navigate = useNavigate();

  // Photos
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photo2, setPhoto2] = useState(null);
  const [photoPreview2, setPhotoPreview2] = useState(null);
  const [groupPhotos, setGroupPhotos] = useState([]); // [{file, preview}]

  // Selection
  const [selectedEra, setSelectedEra] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [customDescription, setCustomDescription] = useState('');
  const [style, setStyle] = useState('balanced');
  const [isTransforming, setIsTransforming] = useState(false);

  // Usage / limits
  const [userProfile, setUserProfile] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [remaining, setRemaining] = useState(FREE_DAILY_LIMIT);

  // Ad gate
  const [adGateOpen, setAdGateOpen] = useState(false);
  const [pendingMode, setPendingMode] = useState(null);

  // Share for bonus
  const [shareForBonus, setShareForBonus] = useState(false);
  const [lastTransformation, setLastTransformation] = useState(null);
  const [postGenModalOpen, setPostGenModalOpen] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      if (authed) {
        const me = await base44.auth.me();
        setUserEmail(me.email);
        const profile = await getOrCreateProfile(me.email);
        setUserProfile(profile);
        setRemaining(getRemainingToday(profile));

        // Auto-redeem referral code from URL if not already used
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        if (refCode && !profile.referred_by) {
          try {
            await base44.functions.invoke('redeemReferral', { referral_code: refCode.toUpperCase() });
            const updated = await getOrCreateProfile(me.email);
            setUserProfile(updated);
            setRemaining(getRemainingToday(updated));
          } catch (_) {
            // Silently ignore invalid / already-used codes
          }
        }
      }
    });
  }, []);

  const handlePhotoSelect = (file) => {
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target.result);
    reader.readAsDataURL(file);
  };
  const handleClearPhoto = () => { setPhoto(null); setPhotoPreview(null); };

  const handlePhotoSelect2 = (file) => {
    setPhoto2(file);
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview2(e.target.result);
    reader.readAsDataURL(file);
  };
  const handleClearPhoto2 = () => { setPhoto2(null); setPhotoPreview2(null); };

  const handleGroupAdd = (file, preview) => {
    setGroupPhotos((prev) => [...prev, { file, preview }]);
  };
  const handleGroupRemove = (index) => {
    setGroupPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleModeSelect = (modeId) => {
    const isSame = selectedMode === modeId;
    if (isSame) {
      setSelectedMode(null);
      setSelectedEra(null);
      setGroupPhotos([]);
      return;
    }

    // Check if ad-gated and not pro
    const isPro = userProfile?.plan !== 'free';
    if (AD_GATED_MODES.includes(modeId) && !isPro) {
      setPendingMode(modeId);
      setAdGateOpen(true);
      return;
    }

    applyMode(modeId);
  };

  const applyMode = (modeId) => {
    setSelectedMode(modeId);
    setSelectedEra(null);
    if (modeId !== 'couples') { setPhoto2(null); setPhotoPreview2(null); }
    if (modeId !== 'group') { setGroupPhotos([]); }
  };

  const handleAdUnlocked = () => {
    if (pendingMode) applyMode(pendingMode);
    setPendingMode(null);
  };

  const handleTransform = async () => {
    if (!photo || !selectedEra) return;
    if (remaining <= 0) return;

    setIsTransforming(true);
    const isCustom = selectedEra === 'custom';
    const mode = SPECIAL_MODES.find((m) => m.id === selectedMode);
    const baseEra = isCustom
      ? { id: 'custom', label: 'Custom', prompt: customDescription }
      : ERAS.find((e) => e.id === selectedEra);

    const styleSuffix = STYLE_PROMPTS[style];
    const isMultiPerson = selectedMode === 'couples' || selectedMode === 'group';

    let finalPrompt;
    if (isCustom) {
      const customEraPrompt = `Transform this person: ${customDescription}.`;
      finalPrompt = mode && isMultiPerson
        ? buildGroupFaceSwapPrompt(mode.promptPrefix, customEraPrompt, styleSuffix)
        : buildFaceSwapPrompt(customEraPrompt, styleSuffix);
    } else {
      finalPrompt = mode && isMultiPerson
        ? buildGroupFaceSwapPrompt(mode.promptPrefix, baseEra.prompt, styleSuffix)
        : buildFaceSwapPrompt(baseEra.prompt, styleSuffix);
    }

    const { file_url } = await base44.integrations.Core.UploadFile({ file: photo });
    const extraUrls = [];

    if (selectedMode === 'couples' && photo2) {
      const { file_url: url2 } = await base44.integrations.Core.UploadFile({ file: photo2 });
      extraUrls.push(url2);
    }

    if (selectedMode === 'group' && groupPhotos.length > 0) {
      for (const gp of groupPhotos) {
        const { file_url: gUrl } = await base44.integrations.Core.UploadFile({ file: gp.file });
        extraUrls.push(gUrl);
      }
    }

    const transformation = await base44.entities.Transformation.create({
      original_photo_url: file_url,
      era: baseEra.id,
      era_label: isCustom ? customDescription.slice(0, 40) : baseEra.label,
      status: 'processing',
    });

    const result = await base44.integrations.Core.GenerateImage({
      prompt: finalPrompt,
      existing_image_urls: [file_url, ...extraUrls],
    });

    await base44.entities.Transformation.update(transformation.id, {
      transformed_photo_url: result.url,
      status: 'completed',
    });

    // Consume a daily generation
    if (userProfile) {
      await consumeTransformation(userProfile);
      const updated = await getOrCreateProfile(userEmail);
      setUserProfile(updated);
      setRemaining(getRemainingToday(updated));
    }

    const completedTransformation = { ...transformation, transformed_photo_url: result.url, era_label: isCustom ? customDescription.slice(0, 40) : baseEra.label };
    setLastTransformation(completedTransformation);
    setIsTransforming(false);
    setPostGenModalOpen(true);
    setTimeout(() => navigate(`/result/${transformation.id}`), 100);
  };

  const activeEra = ERAS.find((e) => e.id === selectedEra);
  const activeMode = SPECIAL_MODES.find((m) => m.id === selectedMode);
  const filteredEras = selectedMode && activeMode?.eraIds
    ? ERAS.filter((e) => activeMode.eraIds.includes(e.id))
    : ERAS;

  const isGroup = selectedMode === 'group';
  const isCouples = selectedMode === 'couples';

  const canTransform = photo && selectedEra && !isTransforming && remaining > 0 &&
    !(selectedEra === 'custom' && !customDescription.trim()) &&
    !(isCouples && !photo2) &&
    !(isGroup && groupPhotos.length === 0);

  return (
    <div className="min-h-screen">
      <AnimatePresence>
        {isTransforming && (
          <TransformingOverlay eraLabel={selectedEra === 'custom' ? customDescription.slice(0, 30) : activeEra?.label} />
        )}
      </AnimatePresence>

      <AdGateModal
        open={adGateOpen}
        onOpenChange={setAdGateOpen}
        modeName={SPECIAL_MODES.find(m => m.id === pendingMode)?.label || ''}
        onUnlocked={handleAdUnlocked}
      />

      <PostGenerationModal
        open={postGenModalOpen}
        onClose={() => setPostGenModalOpen(false)}
        transformation={lastTransformation}
        referralCode={userProfile?.referral_code}
        remaining={remaining}
      />

      {/* Header */}
      <div className="px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-3"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Clock className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground leading-tight">Chronos Booth</h1>
            <p className="text-muted-foreground text-[10px] leading-none">See who you were in another era.</p>
          </div>
          {userProfile && (
            <div className="ml-auto text-right">
              <p className="text-[10px] text-muted-foreground">Today</p>
              <p className="text-xs font-bold text-primary">{remaining === Infinity ? '∞' : remaining} left</p>
            </div>
          )}
        </motion.div>

        {/* Quick-action strip */}
        <div className="flex gap-2">
          <Link
            to="/find-timeline"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-bold text-primary">Find My Timeline</span>
          </Link>
          <Link
            to="/era-pack"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-accent/10 border border-accent/20 hover:bg-accent/20 transition-colors"
          >
            <Package className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-bold text-accent">Era Pack</span>
          </Link>
        </div>
      </div>

      {/* Limit Banner */}
      <LimitBanner
        remaining={remaining}
        onShareForBonus={() => lastTransformation && setShareForBonus(true)}
      />

      {/* Share for bonus sheet */}
      {lastTransformation && (
        <ShareSheet
          open={shareForBonus}
          onOpenChange={setShareForBonus}
          transformation={lastTransformation}
        />
      )}

      {/* Photo Upload Section */}
      <div className="px-5 mb-5">
        {isCouples ? (
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground text-center mb-2 font-medium">Person 1</p>
              <PhotoUploader photoPreview={photoPreview} onPhotoSelect={handlePhotoSelect} onClear={handleClearPhoto} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground text-center mb-2 font-medium">Person 2</p>
              <PhotoUploader photoPreview={photoPreview2} onPhotoSelect={handlePhotoSelect2} onClear={handleClearPhoto2} />
            </div>
          </div>
        ) : isGroup ? (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Main photo (you or anyone in the group)</p>
              <PhotoUploader photoPreview={photoPreview} onPhotoSelect={handlePhotoSelect} onClear={handleClearPhoto} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Add more people</p>
              <GroupPhotoUploader photos={groupPhotos} onAdd={handleGroupAdd} onRemove={handleGroupRemove} />
            </div>
          </div>
        ) : (
          <PhotoUploader photoPreview={photoPreview} onPhotoSelect={handlePhotoSelect} onClear={handleClearPhoto} />
        )}
      </div>

      {/* Special Modes */}
      <div className="mb-5">
        <div className="px-5 mb-2">
          <h2 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Special Modes
          </h2>
        </div>
        <SpecialModeBar
          modes={SPECIAL_MODES}
          selectedMode={selectedMode}
          onSelect={handleModeSelect}
          adGatedModes={AD_GATED_MODES}
          userPlan={userProfile?.plan || 'free'}
        />
      </div>

      {/* Style Selector */}
      <div className="mb-5">
        <StyleSelector value={style} onChange={setStyle} />
      </div>

      {/* Era Selection */}
      <div className="px-5">
        <h2 className="font-display text-lg font-semibold text-foreground mb-3">
          {selectedMode ? `${activeMode?.label} Eras` : 'Choose Your Era'}
        </h2>
        <div className="grid grid-cols-3 gap-2.5">
          {filteredEras.map((era, index) => (
            <EraCard
              key={era.id}
              era={era}
              index={index}
              isSelected={selectedEra === era.id}
              onClick={() => setSelectedEra(era.id)}
            />
          ))}
          {!selectedMode && (
            <CustomEraCard
              isSelected={selectedEra === 'custom'}
              onClick={() => setSelectedEra('custom')}
            />
          )}
        </div>

        {selectedEra === 'custom' && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
            <textarea
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="Describe your vision... e.g. 'a samurai warrior in feudal Japan' or 'a futuristic superhero'"
              className="w-full rounded-xl bg-secondary/60 border border-border text-foreground text-sm placeholder:text-muted-foreground px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              rows={3}
            />
          </motion.div>
        )}
      </div>

      {/* Transform Button */}
      <div className="px-5 py-6">
        <Button
          onClick={handleTransform}
          disabled={!canTransform}
          className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base gap-2 disabled:opacity-30"
        >
          <Sparkles className="w-5 h-5" />
          {activeMode ? `${activeMode.label} Transform` : 'Unlock My Past Life Portrait'}
          <ArrowRight className="w-4 h-4" />
        </Button>
        {remaining === 0 && (
          <p className="text-center text-xs text-muted-foreground mt-2">
            Daily limit reached · Share a portrait to earn more
          </p>
        )}
      </div>
    </div>
  );
}