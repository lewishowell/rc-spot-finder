"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Spot, CLASSIFICATIONS } from "@/lib/types";

interface FeaturedSpotsProps {
  spots: Spot[];
  onSpotClick: (spot: Spot) => void;
}

function getClassificationColor(classification: string): string {
  const match = CLASSIFICATIONS.find((c) => c.value === classification);
  return match?.color ?? "#9ca3af";
}

function SpotCard({
  spot,
  onClick,
}: {
  spot: Spot;
  onClick: () => void;
}) {
  const score = spot.upvotes - spot.downvotes;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-shrink-0 w-36 rounded-xl overflow-hidden bg-white/70 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
    >
      {/* Thumbnail */}
      <div className="relative w-full h-20 overflow-hidden">
        {spot.imageUrl ? (
          <img
            src={spot.imageUrl}
            alt={spot.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500" />
        )}
        {/* Vote score badge */}
        <span
          className={`absolute top-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            score > 0
              ? "bg-green-500/90 text-white"
              : score < 0
                ? "bg-red-500/90 text-white"
                : "bg-gray-500/80 text-white"
          }`}
        >
          {score > 0 ? `+${score}` : score}
        </span>
      </div>

      {/* Info */}
      <div className="px-2 py-1.5">
        <p className="text-xs font-semibold text-gray-800 truncate leading-tight">
          {spot.name}
        </p>
        <div className="flex items-center gap-1 mt-1">
          {spot.classifications.map((c) => (
            <span
              key={c}
              className="inline-block w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: getClassificationColor(c) }}
              title={CLASSIFICATIONS.find((cl) => cl.value === c)?.label ?? c}
            />
          ))}
        </div>
      </div>
    </button>
  );
}

function ScrollRow({
  title,
  spots,
  onSpotClick,
}: {
  title: string;
  spots: Spot[];
  onSpotClick: (spot: Spot) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const animationRef = useRef<number | null>(null);
  const lastTimestamp = useRef<number>(0);

  const scroll = useCallback(
    (timestamp: number) => {
      if (!scrollRef.current || paused) {
        animationRef.current = requestAnimationFrame(scroll);
        return;
      }

      if (!lastTimestamp.current) {
        lastTimestamp.current = timestamp;
      }

      const delta = timestamp - lastTimestamp.current;
      lastTimestamp.current = timestamp;

      const el = scrollRef.current;
      const maxScroll = el.scrollWidth - el.clientWidth;

      if (maxScroll > 0) {
        // Scroll at ~30px per second
        el.scrollLeft += (delta / 1000) * 30;

        // Loop back to start when reaching end
        if (el.scrollLeft >= maxScroll) {
          el.scrollLeft = 0;
        }
      }

      animationRef.current = requestAnimationFrame(scroll);
    },
    [paused]
  );

  useEffect(() => {
    animationRef.current = requestAnimationFrame(scroll);
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [scroll]);

  const handlePause = () => {
    setPaused(true);
    lastTimestamp.current = 0;
  };

  const handleResume = () => {
    setPaused(false);
    lastTimestamp.current = 0;
  };

  if (spots.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 px-3">
        {title}
      </h3>
      <div
        ref={scrollRef}
        onMouseEnter={handlePause}
        onMouseLeave={handleResume}
        onTouchStart={handlePause}
        onTouchEnd={handleResume}
        className="flex gap-2 overflow-x-auto px-3 pb-1 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {spots.map((spot) => (
          <SpotCard
            key={spot.id}
            spot={spot}
            onClick={() => onSpotClick(spot)}
          />
        ))}
      </div>
    </div>
  );
}

export default function FeaturedSpots({ spots, onSpotClick }: FeaturedSpotsProps) {
  const newestSpots = [...spots]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  const topRatedSpots = [...spots]
    .sort(
      (a, b) =>
        b.upvotes - b.downvotes - (a.upvotes - a.downvotes)
    )
    .slice(0, 5);

  if (spots.length === 0) return null;

  return (
    <div
      className="w-full bg-white/60 backdrop-blur-lg border-t border-white/30 py-2 flex flex-col gap-1"
      style={{ height: "170px" }}
    >
      <ScrollRow title="Newest Spots" spots={newestSpots} onSpotClick={onSpotClick} />
      <ScrollRow title="Top Rated" spots={topRatedSpots} onSpotClick={onSpotClick} />
    </div>
  );
}
