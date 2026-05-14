import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ERAS } from '@/lib/eras';
import { AD_GATED_MODES, SPECIAL_MODES } from '@/lib/specialModes';
import EraCard from '@/components/transform/EraCard';
import CustomEraCard from '@/components/transform/CustomEraCard';
import PhotoUploader from '@/components/transform/PhotoUploader';
import PartnersConfig from '@/components/transform/PartnersConfig.jsx';
import SpecialModeBar from '@/components/transform/SpecialModeBar';
import StyleSelector, { STYLE_PROMPTS } from '@/components/transform/StyleSelector';
import LimitBanner from '@/components/transform/LimitBanner';
import AdGateModal from '@/components/transform/AdGateModal';
import { getOrCreateProfile, getRemainingToday, consumeTransformation } from '@/lib/usageLimit';
import { buildFaceSwapPrompt, buildPartnersPrompt } from '@/lib/faceSwapPrompt';

const FREE_DAILY_LIMIT = 3;

export default function Home() {
  const navigate = useNavigate();

  // Solo mode state
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);

  // Partners mode state
  const [photoA, setPhotoA] = useState(null);
  const [photoPreviewA, setPhotoPreviewA] = useState(null);
  const [photoUrlA, setPhotoUrlA] = useState(null);
  const [photoB, setPhotoB] = useState(null);
  const [photoPreviewB, setPhotoPreviewB] = useState(null);
  const [photoUrlB, setPhotoUrlB] = useState(null);
  const [relationshipVibe, setRelationshipVibe] = useState('partners');
  const [customRelationshipVibe, setCustomRelationshipVibe] = useState('');
  const [styleA, setStyleA] = useState('default');
  const [customStyleA, setCustomStyleA] = useState('');
  const [styleB, setStyleB] = useState('default');
  const [customStyleB, setCustomStyleB] = useState('');

  // Shared state
  const [selectedEra, setSelectedEra] = useState(null);
  const [customEraText, setCustomEraText] = useState('');
  const [selectedMode, setSelectedMode] = useState('solo');
  const [selectedStyle, setSelectedStyle] = useState('balanced');
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformStep, setTransformStep] = useState(0);
  const [error, setError] = useState(null);
  const [adGateMode, setAdGateMode] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Countdown timer
  const [timeUntilReset, setTimeUntilReset] = useState('');

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  useEffect(() => {
    if (user?.email) {
      getOrCreateProfile(user.email).then(setUserProfile);
    }
  }, [user?.email]);

  // Daily countdown
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeUntilReset(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Parse ?era= param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const eraParam = params.get('era');
    if (eraParam) {
      const found = ERAS.find(e => e.id === eraParam);
      if (found) setSelectedEra(found);
    }
  }, []);

  const remaining = userProfile ? getRemainingToday(userProfile) : FREE_DAILY_LIMIT;
  const isPartnersMode = selectedMode === 'partners';

  const handlePhotoSelect = async (file) => {
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoUrl(null);
  };

  const handlePhotoSelectA = async (file) => {
    setPhotoA(file);
    setPhotoPreviewA(URL.createObjectURL(file));
    setPhotoUrlA(null);
  };

  const handlePhotoSelectB = async (file) => {
    setPhotoB(file);
    setPhotoPreviewB(URL.createObjectURL(file));
    setPhotoUrlB(null);
  };

  const handleModeSelect = (modeId) => {
    if (AD_GATED_MODES.includes(modeId) && (!userProfile || userProfile.plan === 'free')) {
      setAdGateMode(modeId);
      return;
    }
    setSelectedMode(modeId);
  };

  const canTransform = () => {
    if (isPartnersMode) return photoPreviewA && photoPreviewB && selectedEra;
    return photoPreview && selectedEra;
  };

  const handleTransform = async () => {
    if (!canTransform()) return;
    if (remaining <= 0) return;

    setIsTransforming(true);
    setTransformStep(0);
    setError(null);

    try {
      // Step 1: Upload photo(s)
      setTransformStep(1);
      let uploadedUrl = isPartnersMode ? photoUrlA : photoUrl;
      if (!uploadedUrl) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: isPartnersMode ? photoA : photo });
        uploadedUrl = file_url;
        if (isPartnersMode) setPhotoUrlA(file_url);
        else setPhotoUrl(file_url);
      }

      let extraUrls = [];
      if (isPartnersMode) {
        let uploadedUrlB = photoUrlB;
        if (!uploadedUrlB) {
          const { file_url: urlB } = await base44.integrations.Core.UploadFile({ file: photoB });
          uploadedUrlB = urlB;
          setPhotoUrlB(urlB);
        }
        extraUrls = [uploadedUrlB];
      }

      // Step 2: Build prompt
      setTransformStep(2);
      const baseEraPrompt = selectedEra?.id === 'custom' ? customEraText : selectedEra?.prompt;
      const selectedModeConfig = SPECIAL_MODES.find(mode => mode.id === selectedMode);
      const eraPrompt = selectedModeConfig?.promptPrefix && !isPartnersMode
        ? `${selectedModeConfig.promptPrefix}${baseEraPrompt}`
        : baseEraPrompt;
      const stylePrompt = STYLE_PROMPTS[selectedStyle] || '';

      let finalPrompt;
      if (isPartnersMode) {
        const resolvedVibe = relationshipVibe === 'custom' ? (customRelationshipVibe || 'partners') : relationshipVibe;
        finalPrompt = buildPartnersPrompt({
          eraPrompt,
          relationshipVibe: resolvedVibe,
          styleA: styleA === 'custom' ? '' : styleA,
          styleB: styleB === 'custom' ? '' : styleB,
          customStyleA: styleA === 'custom' ? customStyleA : '',
          customStyleB: styleB === 'custom' ? customStyleB : '',
          styleSuffix: stylePrompt,
        });
      } else {
        finalPrompt = buildFaceSwapPrompt(eraPrompt, stylePrompt);
      }

      // Step 3: Create DB record
      setTransformStep(3);
      const transformation = await base44.entities.Transformation.create({
        original_photo_url: uploadedUrl,
        extra_photo_urls: extraUrls,
        era: selectedEra?.id === 'custom' ? 'custom' : selectedEra?.id,
        era_label: selectedEra?.id === 'custom' ? (customEraText.slice(0, 30) || 'Custom Era') : selectedEra?.label,
        status: 'processing',
      });

      // Step 4: AI transform
      setTransformStep(4);
      const response = await base44.functions.invoke('transformPhoto', {
        prompt: finalPrompt,
        original_photo_url: uploadedUrl,
        extra_photo_urls: extraUrls,
      });

      if (response.data?.error) throw new Error(response.data.error);

      // Step 5: Save result
      setTransformStep(5);
      await base44.entities.Transformation.update(transformation.id, {
        transformed_photo_url: response.data.url,
        status: 'completed',
      });

      if (user?.email && userProfile) {
        await consumeTransformation(userProfile);
        getOrCreateProfile(user.email).then(setUserProfile);
      }

      navigate(`/result/${transformation.id}`);
    } catch (err) {
      setError(err.message || 'Transformation failed. Please try again.');
      setIsTransforming(false);
      setTransformStep(0);
    }
  };

  const STEPS = ['', 'Uploading photo…', 'Building prompt…', 'Preparing…', 'Generating portrait…', 'Finalizing…'];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground leading-tight">Chronos Booth</h1>
            <p className="text-muted-foreground text-xs">Step into another era</p>
          </div>
          <button onClick={() => navigate('/find-timeline')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/15 border border-primary/30 text-primary text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Find My Era
          </button>
        </div>
      </div>

      {/* Limit banner */}
      <div className="px-5 mb-3">
        <LimitBanner remaining={remaining} timeUntilReset={timeUntilReset} profile={userProfile} />
      </div>

      {/* Special mode bar */}
      <div className="mb-4">
        <SpecialModeBar selectedMode={selectedMode} onModeSelect={handleModeSelect} userProfile={userProfile} />
      </div>

      <div className="px-5 space-y-5">
        {/* Photo upload */}
        {isPartnersMode ? (
          <PartnersConfig
            photoPreviewA={photoPreviewA} onPhotoSelectA={handlePhotoSelectA} onClearA={() => { setPhotoA(null); setPhotoPreviewA(null); setPhotoUrlA(null); }}
            photoPreviewB={photoPreviewB} onPhotoSelectB={handlePhotoSelectB} onClearB={() => { setPhotoB(null); setPhotoPreviewB(null); setPhotoUrlB(null); }}
            relationshipVibe={relationshipVibe} onRelationshipVibeChange={setRelationshipVibe}
            customRelationshipVibe={customRelationshipVibe} onCustomRelationshipVibeChange={setCustomRelationshipVibe}
            styleA={styleA} onStyleAChange={setStyleA} customStyleA={customStyleA} onCustomStyleAChange={setCustomStyleA}
            styleB={styleB} onStyleBChange={setStyleB} customStyleB={customStyleB} onCustomStyleBChange={setCustomStyleB}
          />
        ) : (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Your Photo</p>
            <PhotoUploader
              photoPreview={photoPreview}
              onPhotoSelect={handlePhotoSelect}
              onClear={() => { setPhoto(null); setPhotoPreview(null); setPhotoUrl(null); }}
            />
          </div>
        )}

        {/* Style selector */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Transformation Style</p>
          <StyleSelector value={selectedStyle} onChange={setSelectedStyle} />
        </div>

        {/* Era grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Choose Your Era</p>
            <button onClick={() => navigate('/era-pack')} className="text-xs text-primary font-semibold flex items-center gap-1">
              Era Packs <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {ERAS.map((era, i) => (
              <EraCard
                key={era.id}
                era={era}
                isSelected={selectedEra?.id === era.id}
                onClick={() => setSelectedEra(era)}
                index={i}
              />
            ))}
            <CustomEraCard
              isSelected={selectedEra?.id === 'custom'}
              onClick={() => setSelectedEra({ id: 'custom', label: 'Custom Era' })}
            />
          </div>
          {selectedEra?.id === 'custom' && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
              <textarea
                value={customEraText}
                onChange={e => setCustomEraText(e.target.value)}
                placeholder="Describe your custom era… e.g. 'A samurai in a neon-lit city, cyberpunk meets feudal Japan'"
                className="w-full rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                rows={3}
              />
            </motion.div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Transform button */}
        <Button
          onClick={handleTransform}
          disabled={!canTransform() || isTransforming || remaining <= 0}
          className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base gap-2 disabled:opacity-40"
        >
          {isTransforming ? (
            <>
              <div className="w-5 h-5 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
              {STEPS[transformStep] || 'Transforming…'}
            </>
          ) : remaining <= 0 ? (
            <>
              <Clock className="w-5 h-5" />
              Resets in {timeUntilReset}
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Transform{isPartnersMode ? ' Both' : ''} →
            </>
          )}
        </Button>
      </div>

      {/* Ad gate modal */}
      <AdGateModal
        open={!!adGateMode}
        onOpenChange={(v) => { if (!v) setAdGateMode(null); }}
        modeName={SPECIAL_MODES.find(m => m.id === adGateMode)?.label || ''}
        onUnlocked={() => { setSelectedMode(adGateMode); setAdGateMode(null); }}
      />
    </div>
  );
}