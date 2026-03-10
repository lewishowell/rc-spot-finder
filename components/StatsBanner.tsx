"use client";

interface StatsBannerProps {
  totalSpots: number;
  totalRegions: number;
  newestSpotName: string | null;
  onNewestSpotClick?: () => void;
}

export default function StatsBanner({
  totalSpots,
  totalRegions,
  newestSpotName,
  onNewestSpotClick,
}: StatsBannerProps) {
  return (
    <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-white/80 backdrop-blur-md rounded-lg shadow-sm border border-gray-200/50 pointer-events-auto">
      <span className="text-sm font-medium text-gray-700">
        <span className="text-blue-600 font-semibold">{totalSpots}</span>
        {" "}spot{totalSpots !== 1 ? "s" : ""} across{" "}
        <span className="text-blue-600 font-semibold">{totalRegions}</span>
        {" "}region{totalRegions !== 1 ? "s" : ""}
      </span>

      {newestSpotName && (
        <>
          <span className="w-px h-4 bg-gray-300" aria-hidden="true" />
          <button
            onClick={onNewestSpotClick}
            className="text-sm text-gray-500 flex items-center gap-1.5 hover:text-blue-600 transition-colors"
          >
            Newest:{" "}
            <span className="font-medium text-blue-600 hover:underline">
              {newestSpotName}
            </span>
          </button>
        </>
      )}
    </div>
  );
}
