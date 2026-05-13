import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Instagram, Music, Download, Loader2, Facebook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function SocialDeeplinks({ transformation }) {
  const [generating, setGenerating] = useState(false);
  const [watermarkedUrl, setWatermarkedUrl] = useState(null);

  const generateWatermarkedImage = async () => {
    setGenerating(true);
    try {
      const canvas = document.createElement('canvas');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = async () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Add semi-transparent overlay at bottom for watermark
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
        
        // Draw Chronos Booth logo text
        ctx.fillStyle = '#FFCC00';
        ctx.font = `bold ${Math.floor(canvas.width * 0.06)}px Arial`;
        ctx.textAlign = 'left';
        ctx.fillText('⏰ Chronos Booth', canvas.width * 0.05, canvas.height - 50);
        
        // Draw era label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = `${Math.floor(canvas.width * 0.04)}px Arial`;
        ctx.fillText(`Era: ${transformation.era_label}`, canvas.width * 0.05, canvas.height - 20);
        
        // Convert to blob and upload
        canvas.toBlob(async (blob) => {
          try {
            const file = new File([blob], 'chronos-watermarked.jpg', { type: 'image/jpeg' });
            const result = await base44.integrations.Core.UploadFile({ file });
            setWatermarkedUrl(result.file_url);
          } catch (err) {
            console.error('Upload failed:', err);
          } finally {
            setGenerating(false);
          }
        }, 'image/jpeg', 0.95);
      };
      
      img.src = transformation.transformed_photo_url;
    } catch (error) {
      console.error('Watermark generation failed:', error);
      setGenerating(false);
    }
  };

  const openInstagramStories = () => {
    if (!watermarkedUrl) {
      generateWatermarkedImage();
      return;
    }
    
    // Instagram Stories deep-link
    const text = `✨ Check me out in the ${transformation.era_label} era on Chronos Booth!`;
    const instagramUrl = `instagram://story-camera/?source_url=${encodeURIComponent(watermarkedUrl)}&caption=${encodeURIComponent(text)}`;
    window.location.href = instagramUrl;
  };

  const openTikTok = () => {
    if (!watermarkedUrl) {
      generateWatermarkedImage();
      return;
    }
    
    // TikTok share URL - opens TikTok app or web
    const tiktokUrl = `https://www.tiktok.com/create?source=photo&photo_url=${encodeURIComponent(watermarkedUrl)}`;
    window.open(tiktokUrl, '_blank');
  };

  const openFacebook = () => {
    if (!watermarkedUrl) {
      generateWatermarkedImage();
      return;
    }
    
    // Facebook share dialog
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(watermarkedUrl)}&quote=${encodeURIComponent(`✨ Check me out in the ${transformation.era_label} era on Chronos Booth!`)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-5 space-y-3"
    >
      <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Share to Social
      </h3>
      
      <div className="space-y-2">
        <Button
          onClick={openInstagramStories}
          disabled={generating}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:opacity-90 text-white gap-2 disabled:opacity-50"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Instagram className="w-4 h-4" />
          )}
          {generating ? 'Generating...' : 'Instagram Stories'}
        </Button>

        <Button
          onClick={openTikTok}
          disabled={generating}
          className="w-full h-11 rounded-xl bg-black hover:bg-black/90 text-white gap-2 disabled:opacity-50"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Music className="w-4 h-4" />
          )}
          {generating ? 'Generating...' : 'TikTok'}
        </Button>

        <Button
          onClick={openFacebook}
          disabled={generating}
          className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2 disabled:opacity-50"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Facebook className="w-4 h-4" />
          )}
          {generating ? 'Generating...' : 'Facebook'}
        </Button>

        {watermarkedUrl && (
          <Button
            onClick={() => window.open(watermarkedUrl, '_blank')}
            variant="outline"
            className="w-full h-11 rounded-xl gap-2"
          >
            <Download className="w-4 h-4" />
            Download Watermarked
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Watermarked with Chronos Booth logo and era label
      </p>
    </motion.div>
  );
}