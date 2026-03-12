"use client";

import { Spot, CLASSIFICATIONS } from "@/lib/types";

interface SpotOfTheDayProps {
  spot: Spot | null;
  onSpotClick: (spot: Spot) => void;
}

export default function SpotOfTheDay({ spot, onSpotClick }: SpotOfTheDayProps) {
  if (!spot) return null;

  const voteScore = spot.upvotes - spot.downvotes;

  return (
    <button
      onClick={() => onSpotClick(spot)}
      className="hidden md:block fixed bottom-16 left-4 w-[200px] h-[120px] rounded-lg overflow-hidden shadow-lg border border-white/20 z-[999] cursor-pointer group transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {/* Background image or fallback */}
      {spot.imageUrl ? (
        <img
          src={spot.imageUrl}
          alt={spot.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700" />
      )}

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 backdrop-blur-[2px]" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-2.5">
        {/* Top label */}
        <span className="self-start text-[10px] font-semibold uppercase tracking-wider text-white/90 bg-white/15 backdrop-blur-sm px-1.5 py-0.5 rounded">
          Spot of the Day
        </span>

        {/* Bottom info */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            {spot.classifications.map((cls) => {
              const config = CLASSIFICATIONS.find((c) => c.value === cls);
              return (
                <span
                  key={cls}
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: config?.color ?? "#9ca3af" }}
                  title={config?.label ?? cls}
                />
              );
            })}
          </div>
          <div className="flex items-end justify-between gap-2">
            <span className="text-sm font-semibold text-white leading-tight truncate">
              {spot.name}
            </span>
            <span className="text-xs font-medium text-white/80 flex-shrink-0">
              {voteScore > 0 ? "+" : ""}
              {voteScore}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
