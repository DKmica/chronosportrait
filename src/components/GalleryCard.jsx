import React from "react";
import { motion } from "framer-motion";
import { ERAS } from "@/lib/eras";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

export default function GalleryCard({ transformation, index }) {
  const era = ERAS.find(e => e.key === transformation.era_key);
  const isProcessing = transformation.status === "processing";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative rounded-xl overflow-hidden border border-border/50 bg-secondary/30 group"
    >
      {isProcessing ? (
        <div className="aspect-square flex items-center justify-center bg-secondary/50">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : (
        <img
          src={transformation.transformed_image_url}
          alt={transformation.era}
          className="w-full aspect-square object-cover"
        />
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
        <p className="text-white font-heading font-semibold text-sm flex items-center gap-1.5">
          {era?.emoji} {transformation.era}
        </p>
        <p className="text-white/60 text-[10px] font-body mt-0.5">
          {format(new Date(transformation.created_date), "MMM d, yyyy")}
        </p>
      </div>
    </motion.div>
  );
}