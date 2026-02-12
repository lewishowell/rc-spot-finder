"use client";

import { FilterOptions, CLASSIFICATIONS, REGIONS } from "@/lib/types";

interface FilterPanelProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function FilterPanel({ filters, onFiltersChange, isOpen, onToggle }: FilterPanelProps) {
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Region
            </label>
            <select
              value={filters.region || "all"}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  region: e.target.value === "all" ? undefined : e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Regions</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="createdAt">Date Added</option>
              <option value="rating">Rating</option>
              <option value="name">Name</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              })
            }
            className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
