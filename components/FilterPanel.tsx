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
      await onSetDefaultRegion(filters.region || null);
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

  const hasActiveFilters =
    (filters.classification && filters.classification !== "all") ||
    filters.region ||
    filters.mySpots ||
    filters.myFavorites ||
    filters.sortBy !== "createdAt" ||
    filters.sortOrder !== "desc";

  return (
    <div className="space-y-2">
      {/* Toggle row */}
      <div className="flex items-center justify-between">
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 010 2H4a1 1 0 01-1-1zm4 6a1 1 0 011-1h8a1 1 0 010 2H8a1 1 0 01-1-1zm2 6a1 1 0 011-1h4a1 1 0 010 2h-4a1 1 0 01-1-1z" />
          </svg>
          Filters
          <svg
            className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {hasActiveFilters && (
          <button
            onClick={() =>
              onFiltersChange({
                classification: "all",
                region: undefined,
                sortBy: "createdAt",
                sortOrder: "desc",
                mySpots: false,
                myFavorites: false,
              })
            }
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {isOpen && (
        <div className="space-y-3">
          {/* User toggles */}
          {session && (
            <div className="flex gap-2">
              <button
                onClick={() => onFiltersChange({ ...filters, mySpots: !filters.mySpots })}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  filters.mySpots
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                My Spots
              </button>
              <button
                onClick={() => onFiltersChange({ ...filters, myFavorites: !filters.myFavorites })}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${
                  filters.myFavorites
                    ? "bg-red-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                Favorites
              </button>
            </div>
          )}

          {/* Classification pills */}
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5 block">Type</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => onFiltersChange({ ...filters, classification: "all" })}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  !filters.classification || filters.classification === "all"
                    ? "bg-gray-800 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              {CLASSIFICATIONS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => onFiltersChange({ ...filters, classification: c.value })}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    filters.classification === c.value
                      ? "text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  style={
                    filters.classification === c.value
                      ? { backgroundColor: c.color }
                      : undefined
                  }
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Region pills */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Region</span>
              {session && onSetDefaultRegion && (
                <div className="flex gap-1.5">
                  {filters.region && !isCurrentRegionDefault && (
                    <button
                      onClick={handleSetDefaultRegion}
                      disabled={isSaving}
                      className="text-[10px] text-blue-600 font-medium hover:text-blue-700 disabled:opacity-50"
                    >
                      {isSaving ? "..." : "Set Default"}
                    </button>
                  )}
                  {defaultRegion && (
                    <button
                      onClick={handleClearDefaultRegion}
                      disabled={isSaving}
                      className="text-[10px] text-gray-400 font-medium hover:text-gray-600 disabled:opacity-50"
                    >
                      {isSaving ? "..." : "Clear Default"}
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => onFiltersChange({ ...filters, region: undefined })}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  !filters.region
                    ? "bg-gray-800 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              {REGIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => onFiltersChange({ ...filters, region: r })}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    filters.region === r
                      ? "bg-teal-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }${r === defaultRegion ? " ring-1 ring-blue-400" : ""}`}
                >
                  {r}
                  {r === defaultRegion && <span className="ml-1 text-[9px] opacity-70">*</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Sort pills */}
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5 block">Sort</span>
            <div className="flex items-center gap-1.5">
              {[
                { value: "createdAt", label: "Newest" },
                { value: "votes", label: "Top Voted" },
                { value: "name", label: "Name" },
                { value: "distance", label: "Near Me" },
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() =>
                    onFiltersChange({
                      ...filters,
                      sortBy: s.value as FilterOptions["sortBy"],
                    })
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    (filters.sortBy || "createdAt") === s.value
                      ? "bg-gray-800 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {s.label}
                </button>
              ))}
              <button
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
                  })
                }
                className="ml-1 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-all"
                title={filters.sortOrder === "asc" ? "Ascending" : "Descending"}
              >
                <svg
                  className={`w-3.5 h-3.5 text-gray-600 transition-transform ${filters.sortOrder === "asc" ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
