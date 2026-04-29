import React from "react";
import { motion } from "framer-motion";
import { Download, ArrowLeft, Share2, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TransformationResult({ transformation, era, isLoading, onBack }) {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16 gap-6"
      >
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="font-heading font-bold text-lg text-foreground">
            Creating your transformation...
          </p>
          <p className="text-muted-foreground text-sm font-body">
            {era?.name || "Loading"} • This takes about 10 seconds
          </p>
        </div>
      </motion.div>
    );
  }

  if (!transformation) return null;

  const handleDownload = async () => {
    const link = document.createElement("a");
    link.href = transformation.transformed_image_url;
    link.download = `timewarp-${transformation.era_key}.png`;
    link.target = "_blank";
    link.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-body"
      >
        <ArrowLeft className="w-4 h-4" />
        New transformation
      </button>

      <div className="rounded-2xl overflow-hidden border border-border/50 shadow-2xl shadow-primary/10">
        <img
          src={transformation.transformed_image_url}
          alt={`You as ${era?.name}`}
          className="w-full aspect-square object-cover"
        />
      </div>

      <div className="text-center space-y-1">
        <p className="font-heading font-bold text-xl text-foreground">
          {era?.emoji} {era?.name}
        </p>
        <p className="text-muted-foreground text-sm font-body">
          Your time-warped portrait
        </p>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleDownload} className="flex-1 bg-primary hover:bg-primary/90 font-body">
          <Download className="w-4 h-4 mr-2" />
          Save Image
        </Button>
        <Button onClick={onBack} variant="outline" className="flex-1 font-body">
          Try Another
        </Button>
      </div>
    </motion.div>
  );
}