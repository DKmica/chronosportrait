import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Images, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import GalleryCard from "@/components/GalleryCard";

export default function Gallery() {
  const { data: transformations = [], isLoading } = useQuery({
    queryKey: ["transformations"],
    queryFn: () => base44.entities.Transformation.list("-created_date", 50),
  });

  const completed = transformations.filter((t) => t.status === "completed");

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h1 className="font-heading font-bold text-2xl text-foreground">
          Your Gallery
        </h1>
        <p className="text-muted-foreground text-sm font-body">
          All your time-warped portraits
        </p>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
        </div>
      ) : completed.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 gap-4"
        >
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
            <Images className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-heading font-semibold text-foreground">
              No transformations yet
            </p>
            <p className="text-muted-foreground text-sm font-body">
              Create your first one!
            </p>
          </div>
          <Link to="/">
            <Button className="bg-primary hover:bg-primary/90 font-body">
              <Sparkles className="w-4 h-4 mr-2" />
              Start Transforming
            </Button>
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {completed.map((t, i) => (
            <GalleryCard key={t.id} transformation={t} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}