"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { FilterOptions, CLASSIFICATIONS, REGIONS } from "@/lib/types";

interface FilterPanelProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  isOpen: boolean;
  onToggle: () => void;
  defaultRegion?: string | null;
  onSetDefaultRegion?: (region: string | null) => void;
}

export default function FilterPanel({
  filters,
  onFiltersChange,
  isOpen,
  onToggle,
  defaultRegion,
  onSetDefaultRegion,
}: FilterPanelProps) {
  const { data: session } = useSession();
  const [isSaving, setIsSaving] = useState(false);

  const handleSetDefaultRegion = async () => {
    if (!onSetDefaultRegion) return;

    setIsSaving(true);
    try {
      const newDefault = filters.region || null;
      await onSetDefaultRegion(newDefault);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearDefaultRegion = async () => {
    if (!onSetDefaultRegion) return;

    setIsSaving(true);
    try {
      await onSetDefaultRegion(null);
    } finally {
      setIsSaving(false);
    }
  };

  const isCurrentRegionDefault = filters.region === defaultRegion;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="font-medium text-gray-700">Filters</span>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="p-4 space-y-4 border-t">
          {session && (
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => onFiltersChange({ ...filters, mySpots: !filters.mySpots })}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                filters.mySpots
                  ? "bg-blue-600 border-blue-600"
                  : "bg-white border-gray-300"
              }`}>
                {filters.mySpots && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm font-semibold text-black">My Spots Only</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-black mb-1">
              Classification
            </label>
            <select
              value={filters.classification || "all"}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  classification: e.target.value as FilterOptions["classification"],
                })
              }
              className="w-full px-3 py-2 bg-white border-2 border-gray-500 rounded-md text-black font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              {CLASSIFICATIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-semibold text-black">
                Region
              </label>
              {defaultRegion && (
                <span className="text-xs text-blue-600 font-medium">
                  Default: {defaultRegion}
                </span>
              )}
            </div>
            <select
              value={filters.region || "all"}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  region: e.target.value === "all" ? undefined : e.target.value,
                })
              }
              className="w-full px-3 py-2 bg-white border-2 border-gray-500 rounded-md text-black font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Regions</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {session && onSetDefaultRegion && (
              <div className="mt-2 flex gap-2">
                {filters.region && !isCurrentRegionDefault && (
                  <button
                    onClick={handleSetDefaultRegion}
                    disabled={isSaving}
                    className="flex-1 px-3 py-1.5 text-xs bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Set as Default"}
                  </button>
                )}
                {defaultRegion && (
                  <button
                    onClick={handleClearDefaultRegion}
                    disabled={isSaving}
                    className="flex-1 px-3 py-1.5 text-xs bg-white text-black font-medium border-2 border-gray-500 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Clear Default"}
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-1">
              Sort By
            </label>
            <select
              value={filters.sortBy || "createdAt"}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  sortBy: e.target.value as FilterOptions["sortBy"],
                })
              }
              className="w-full px-3 py-2 bg-white border-2 border-gray-500 rounded-md text-black font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="createdAt">Date Added</option>
              <option value="votes">Community Votes</option>
              <option value="name">Name</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-1">
              Order
            </label>
            <select
              value={filters.sortOrder || "desc"}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  sortOrder: e.target.value as FilterOptions["sortOrder"],
                })
              }
              className="w-full px-3 py-2 bg-white border-2 border-gray-500 rounded-md text-black font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          <button
            onClick={() =>
              onFiltersChange({
                classification: "all",
                region: undefined,
                sortBy: "createdAt",
                sortOrder: "desc",
                mySpots: false,
              })
            }
            className="w-full px-4 py-2 text-sm text-black font-medium bg-white border-2 border-gray-500 rounded-md hover:bg-gray-50 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
