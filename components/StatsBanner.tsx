"use client";

interface StatsBannerProps {
  totalSpots: number;
  totalRegions: number;
  newestSpotName: string | null;
}

export default function StatsBanner({
  totalSpots,
  totalRegions,
  newestSpotName,
}: StatsBannerProps) {
  return (
    <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-white/80 backdrop-blur-md rounded-lg shadow-sm border border-gray-200/50 z-[999] pointer-events-auto">
      <span className="text-sm font-medium text-gray-700">
        <span className="text-blue-600 font-semibold">{totalSpots}</span>
        {" "}spot{totalSpots !== 1 ? "s" : ""} across{" "}
        <span className="text-blue-600 font-semibold">{totalRegions}</span>
        {" "}region{totalRegions !== 1 ? "s" : ""}
      </span>

      {newestSpotName && (
        <>
          <span className="w-px h-4 bg-gray-300" aria-hidden="true" />
          <span className="text-sm text-gray-500 flex items-center gap-1.5">
            Newest:{" "}
            <span className="font-medium text-gray-700 animate-pulse">
              {newestSpotName}
            </span>
          </span>
        </>
      )}
    </div>
  );
}
