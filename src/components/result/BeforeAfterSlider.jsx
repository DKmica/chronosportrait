import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

export default function BeforeAfterSlider({ beforeUrl, afterUrl, label }) {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const updatePosition = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  }, []);

  const handleMouseDown = (e) => { setIsDragging(true); updatePosition(e.clientX); };
  const handleMouseMove = (e) => { if (isDragging) updatePosition(e.clientX); };
  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e) => { setIsDragging(true); updatePosition(e.touches[0].clientX); };
  const handleTouchMove = (e) => { if (isDragging) updatePosition(e.touches[0].clientX); };
  const handleTouchEnd = () => setIsDragging(false);

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl overflow-hidden aspect-square bg-muted cursor-col-resize select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* After (transformed) — full width below */}
      <img src={afterUrl} alt="Transformed" className="absolute inset-0 w-full h-full object-cover" />

      {/* Before (original) — clipped on the left */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${position}%` }}
      >
        <img src={beforeUrl} alt="Original" className="absolute inset-0 h-full object-cover" style={{ width: containerRef.current?.offsetWidth + 'px' }} />
        {/* Before label */}
        <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm">
          <p className="text-white text-xs font-semibold">Original</p>
        </div>
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)]"
        style={{ left: `${position}%` }}
      />

      {/* Handle */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center"
        style={{ left: `${position}%` }}
      >
        <div className="flex gap-0.5">
          <div className="w-0.5 h-4 bg-slate-400 rounded-full" />
          <div className="w-0.5 h-4 bg-slate-400 rounded-full" />
        </div>
      </div>

      {/* After label */}
      <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm">
        <p className="text-white text-xs font-semibold">{label || 'Transformed'}</p>
      </div>
    </div>
  );
}