import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ERAS } from '@/lib/eras';
import { AD_GATED_MODES, SPECIAL_MODES, KID_SCENARIOS, PET_SCENARIOS } from '@/lib/specialModes';
import EraCard from '@/components/transform/EraCard';
import CustomEraCard from '@/components/transform/CustomEraCard';
import PhotoUploader from '@/components/transform/PhotoUploader';
import PartnersConfig from '@/components/transform/PartnersConfig.jsx';
import SpecialModeBar from '@/components/transform/SpecialModeBar';
import ScenarioSelector from '@/components/transform/ScenarioSelector';
import GroupPhotoUploader from '@/components/transform/GroupPhotoUploader';
import LimitBanner from '@/components/transform/LimitBanner';
import SpotlightSection from '@/components/community/SpotlightSection';
import DailyChallenge from '@/components/home/DailyChallenge';
import CreditsDisplay from '@/components/monetization/CreditsDisplay';
import StreakReminderBanner from '@/components/home/StreakReminderBanner';
import AdGateModal from '@/components/transform/AdGateModal';
import LoraSelector from '@/components/transform/LoraSelector';
import { getOrCreateProfile, getRemainingToday, consumeTransformation, addBonusTransformation } from '@/lib/usageLimit';
import { buildFaceSwapPrompt, buildPartnersPrompt, buildGroupPrompt, buildKidsPrompt, buildPetPrompt } from '@/lib/faceSwapPrompt';

// Only flag clearly AI-generated filenames — avoid false positives on normal uploads
const GENERATED_FILENAME_PATTERNS = ['generated_image', 'ai-generated'];
function looksLikeGeneratedImage(url) {
  if (!url) return false;
  const filename = url.split('/').pop().toLowerCase().split('?')[0];
  return GENERATED_FILENAME_PATTERNS.some(p => filename.includes(p));
}

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

  // Kids mode state
  const [selectedKidScenario, setSelectedKidScenario] = useState(null);
  const [customKidText, setCustomKidText] = useState('');

  // Pet mode state
  const [selectedPetScenario, setSelectedPetScenario] = useState(null);
  const [customPetText, setCustomPetText] = useState('');

  // Group mode state
  const [groupPhotos, setGroupPhotos] = useState([]); // [{file, preview, url}]

  // Shared state
  const [selectedEra, setSelectedEra] = useState(null);
  const [customEraText, setCustomEraText] = useState('');
  const [selectedMode, setSelectedMode] = useState('solo');
  const [selectedStyle, setSelectedStyle] = useState('balanced');
  const [selectedLoraId, setSelectedLoraId] = useState(null);
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

  const handleShareForBonus = async () => {
    const shareText = 'Check out my historical portrait made with Chronos Booth! 🎨 Step into another era at ChronosBooth';
    let shared = false;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Chronos Booth', text: shareText });
        shared = true;
      }
    } catch (e) {
      // Share dialog cancelled or failed — try clipboard fallback
    }
    if (!shared) {
      try {
        await navigator.clipboard.writeText(shareText);
        alert('Link copied! Share it to earn a bonus transformation.');
        shared = true;
      } catch (e) {
        alert('Share this app with your friends to earn bonus transformations!');
        shared = true;
      }
    }
    // Award the bonus whenever the user attempted to share
    if (shared && userProfile) {
      await addBonusTransformation(userProfile, 1);
      const updated = await getOrCreateProfile(user.email);
      setUserProfile(updated);
    }
  };
  const isPartnersMode = selectedMode === 'partners';
  const isKidsMode = selectedMode === 'kids';
  const isPetMode = selectedMode === 'pet';
  const isGroupMode = selectedMode === 'group';

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

  const handleGroupAdd = (file, preview) => {
    if (groupPhotos.length >= 10) return;
    setGroupPhotos(prev => [...prev, { file, preview, url: null }]);
  };

  const handleGroupRemove = (index) => {
    setGroupPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleGroupReorder = (from, to) => {
    setGroupPhotos(prev => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  };

  const canTransform = () => {
    if (isPartnersMode) return photoPreviewA && photoPreviewB && selectedEra;
    if (isKidsMode) return photoPreview && selectedKidScenario;
    if (isPetMode) return photoPreview && selectedPetScenario;
    if (isGroupMode) return groupPhotos.length >= 2 && selectedEra;
    return photoPreview && selectedEra;
  };

  const handleTransform = async () => {
    if (!canTransform()) return;
    if (remaining <= 0) return;

    setIsTransforming(true);
    setTransformStep(0);
    setError(null);

    try {
      // Step 0: Validate — reject generated images as references
      const urlsToCheck = isPartnersMode
        ? [photoUrlA, photoUrlB].filter(Boolean)
        : isGroupMode
        ? groupPhotos.map(p => p.url).filter(Boolean)
        : [photoUrl].filter(Boolean);

      for (const url of urlsToCheck) {
        if (looksLikeGeneratedImage(url)) {
          setError('Please upload original face photos, not previously generated ChronosBooth images. Generated images reduce face accuracy.');
          setIsTransforming(false);
          return;
        }
      }

      // Step 1: Upload photo(s)
      setTransformStep(1);
      let uploadedUrl;
      let extraUrls = [];

      if (isGroupMode) {
        // Upload all group photos
        const uploaded = await Promise.all(
          groupPhotos.map(async (p) => {
            if (p.url) return p.url;
            const { file_url } = await base44.integrations.Core.UploadFile({ file: p.file });
            return file_url;
          })
        );
        setGroupPhotos(prev => prev.map((p, i) => ({ ...p, url: uploaded[i] })));
        uploadedUrl = uploaded[0];
        extraUrls = uploaded.slice(1);
      } else if (isPartnersMode) {
        uploadedUrl = photoUrlA;
        if (!uploadedUrl) {
          const { file_url } = await base44.integrations.Core.UploadFile({ file: photoA });
          uploadedUrl = file_url;
          setPhotoUrlA(file_url);
        }
        let uploadedUrlB = photoUrlB;
        if (!uploadedUrlB) {
          const { file_url: urlB } = await base44.integrations.Core.UploadFile({ file: photoB });
          uploadedUrlB = urlB;
          setPhotoUrlB(urlB);
        }
        extraUrls = [uploadedUrlB];
      } else {
        uploadedUrl = photoUrl;
        if (!uploadedUrl) {
          const { file_url } = await base44.integrations.Core.UploadFile({ file: photo });
          uploadedUrl = file_url;
          setPhotoUrl(file_url);
        }
      }

      // Step 2: Build prompt
      setTransformStep(2);
      const stylePrompt = '';

      let finalPrompt;
      let eraId = selectedEra?.id;
      let eraLabel = selectedEra?.label;

      if (isPartnersMode) {
        const baseEraPrompt = selectedEra?.id === 'custom' ? customEraText : selectedEra?.prompt;
        const resolvedVibe = relationshipVibe === 'custom' ? (customRelationshipVibe || 'partners') : relationshipVibe;
        eraId = selectedEra?.id === 'custom' ? 'custom' : selectedEra?.id;
        eraLabel = selectedEra?.label || 'Selected Era';
        finalPrompt = buildPartnersPrompt({
          eraPrompt: baseEraPrompt,
          eraLabel,
          relationshipVibe: resolvedVibe,
          styleA: styleA === 'custom' ? '' : styleA,
          styleB: styleB === 'custom' ? '' : styleB,
          customStyleA: styleA === 'custom' ? customStyleA : '',
          customStyleB: styleB === 'custom' ? customStyleB : '',
        });
      } else if (isKidsMode) {
        const scenario = selectedKidScenario;
        const scenarioPrompt = scenario.id === 'custom' ? customKidText : scenario.prompt;
        eraId = `kids_${scenario.id}`;
        eraLabel = scenario.label;
        finalPrompt = buildKidsPrompt({ scenarioPrompt, scenarioLabel: scenario.label });
      } else if (isPetMode) {
        const scenario = selectedPetScenario;
        const scenarioPrompt = scenario.id === 'custom' ? customPetText : scenario.prompt;
        eraId = `pet_${scenario.id}`;
        eraLabel = scenario.label;
        finalPrompt = buildPetPrompt({ scenarioPrompt, scenarioLabel: scenario.label });
      } else if (isGroupMode) {
        const baseEraPrompt = selectedEra?.id === 'custom' ? customEraText : selectedEra?.prompt;
        eraId = selectedEra?.id === 'custom' ? 'custom' : selectedEra?.id;
        eraLabel = selectedEra?.label || 'Selected Era';
        finalPrompt = buildGroupPrompt({ eraPrompt: baseEraPrompt, eraLabel, count: groupPhotos.length });
      } else {
        const baseEraPrompt = selectedEra?.id === 'custom' ? customEraText : selectedEra?.prompt;
        const selectedModeConfig = SPECIAL_MODES.find(mode => mode.id === selectedMode);
        const eraPrompt = selectedModeConfig?.promptPrefix
          ? `${selectedModeConfig.promptPrefix}${baseEraPrompt}`
          : baseEraPrompt;
        eraId = selectedEra?.id === 'custom' ? 'custom' : selectedEra?.id;
        eraLabel = selectedEra?.id === 'custom' ? (customEraText.slice(0, 30) || 'Custom Era') : selectedEra?.label;

        // Inject LoRA face description for higher consistency
        let loraExtraContext = '';
        if (selectedLoraId) {
          const { StyleLora } = base44.entities;
          const loraList = await StyleLora.filter({ id: selectedLoraId });
          const lora = loraList?.[0];
          if (lora?.face_description) {
            loraExtraContext = `\nPERSONAL IDENTITY LOCK (AI Model: ${lora.name}):\n${lora.face_description}\nPreserve ALL of the above features with the highest priority.`;
            // increment usage count
            StyleLora.update(lora.id, { transformations_using_lora: (lora.transformations_using_lora || 0) + 1 });
          }
        }

        finalPrompt = buildFaceSwapPrompt(eraPrompt + loraExtraContext, eraLabel);
      }

      // Step 3: Create DB record
      setTransformStep(3);
      const transformation = await base44.entities.Transformation.create({
        original_photo_url: uploadedUrl,
        extra_photo_urls: extraUrls,
        era: eraId,
        era_label: eraLabel,
        status: 'processing',
      });

      // Step 4: AI transform
      setTransformStep(4);
      const response = await base44.functions.invoke('transformPhoto', {
        prompt: finalPrompt,
        original_photo_url: uploadedUrl,
        extra_photo_urls: extraUrls,
        transformation_id: transformation.id,
      });

      if (response.data?.error) {
        // Mark the record as failed so it doesn't get stuck in processing
        await base44.entities.Transformation.update(transformation.id, { status: 'failed' });
        throw new Error(response.data.error);
      }

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
      let msg = err.message || 'Transformation failed. Please try again.';
      if (msg.includes('400') || msg.toLowerCase().includes('request failed')) {
        msg = 'Generation request failed. Please try again with clear, original face photos. Avoid screenshots, collages, generated images, or group photos.';
      }
      setError(msg);
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
            <h1 className="font-display text-2xl font-bold text-foreground leading-tight">ChronosBooth</h1>
            <p className="text-muted-foreground text-xs">The AI Time Machine for You, Couples &amp; Crews</p>
          </div>
          <div className="flex items-center gap-2">
            <CreditsDisplay profile={userProfile} />
            <button onClick={() => navigate('/find-timeline')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/15 border border-primary/30 text-primary text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Find My Era
            </button>
          </div>
        </div>
      </div>

      {/* Limit banner */}
      <div className="px-5 mb-3">
        <LimitBanner remaining={remaining} timeUntilReset={timeUntilReset} profile={userProfile} onShareForBonus={handleShareForBonus} />
      </div>

      {/* Streak reminder */}
      <StreakReminderBanner profile={userProfile} />

      {/* Daily Challenge */}
      <DailyChallenge
        profile={userProfile}
        onProfileUpdate={() => user?.email && getOrCreateProfile(user.email).then(setUserProfile)}
      />

      {/* Community Spotlight */}
      <SpotlightSection />

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
        ) : isGroupMode ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Group Photos (2–6 people)</p>
              <span className="text-xs text-muted-foreground">{groupPhotos.length}/6</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Upload one clear photo per person (2–6 people). Use front-facing photos with good lighting. Avoid sunglasses, heavy filters, hats, collages, screenshots, and group photos.</p>
            <GroupPhotoUploader
              photos={groupPhotos}
              onAdd={handleGroupAdd}
              onRemove={handleGroupRemove}
              onReorder={handleGroupReorder}
              maxPhotos={10}
            />
          </div>
        ) : (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {isKidsMode ? "Child's Photo" : isPetMode ? "Pet's Photo" : 'Your Photo'}
            </p>
            <PhotoUploader
              photoPreview={photoPreview}
              onPhotoSelect={handlePhotoSelect}
              onClear={() => { setPhoto(null); setPhotoPreview(null); setPhotoUrl(null); }}
            />
          </div>
        )}

        {/* LoRA model selector (solo mode only) */}
        {!isPartnersMode && !isKidsMode && !isPetMode && !isGroupMode && (
          <LoraSelector selectedLoraId={selectedLoraId} onSelect={setSelectedLoraId} />
        )}

        {/* Kids scenario selector */}
        {isKidsMode && (
          <ScenarioSelector
            scenarios={KID_SCENARIOS}
            selected={selectedKidScenario}
            onSelect={setSelectedKidScenario}
            customText={customKidText}
            onCustomTextChange={setCustomKidText}
            label="Choose a Kid Scenario"
          />
        )}

        {/* Pet scenario selector */}
        {isPetMode && (
          <ScenarioSelector
            scenarios={PET_SCENARIOS}
            selected={selectedPetScenario}
            onSelect={setSelectedPetScenario}
            customText={customPetText}
            onCustomTextChange={setCustomPetText}
            label="Choose a Pet Scenario"
          />
        )}

        {/* Era grid — shown for solo, partners, group, birthday (not kids/pet) */}
        {!isKidsMode && !isPetMode && (
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
        )}

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