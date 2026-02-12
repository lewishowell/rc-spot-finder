export type Classification = "bash" | "race" | "crawl" | "hobby" | "airfield";

export interface Spot {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  classification: Classification;
  rating: number;
  imageUrl: string | null;
  region: string | null;
  createdAt: Date;
  updatedAt: Date;
  associatedHobbyShopId: string | null;
  associatedHobbyShop?: Spot | null;
}

// Re-export as Location for component compatibility
export type { Spot as Location };

export interface LocationFormData {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  classification: Classification;
  rating: number;
  imageUrl?: string;
  region?: string;
  associatedHobbyShopId?: string;
}

export interface FilterOptions {
  classification?: Classification | "all";
  region?: string;
  sortBy?: "name" | "rating" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export const CLASSIFICATIONS: { value: Classification; label: string; color: string }[] = [
  { value: "bash", label: "Bash Spot", color: "#ef4444" },
  { value: "race", label: "Race Track", color: "#3b82f6" },
  { value: "crawl", label: "Crawl Area", color: "#22c55e" },
  { value: "hobby", label: "Hobby Shop", color: "#f97316" },
  { value: "airfield", label: "Air Field", color: "#8b5cf6" },
];

export const REGIONS = [
  "Northeast",
  "Southeast",
  "Midwest",
  "Southwest",
  "West Coast",
  "Pacific Northwest",
  "California",
  "Texas",
  "Florida",
  "Other",
];

export const REGION_COORDINATES: Record<string, { lat: number; lng: number; zoom: number }> = {
  "Northeast": { lat: 42.5, lng: -73.5, zoom: 6 },
  "Southeast": { lat: 33.5, lng: -84.0, zoom: 5 },
  "Midwest": { lat: 41.5, lng: -89.0, zoom: 5 },
  "Southwest": { lat: 34.0, lng: -111.0, zoom: 5 },
  "West Coast": { lat: 37.5, lng: -122.0, zoom: 5 },
  "Pacific Northwest": { lat: 46.5, lng: -122.5, zoom: 6 },
  "California": { lat: 36.5, lng: -119.5, zoom: 6 },
  "Texas": { lat: 31.0, lng: -99.5, zoom: 6 },
  "Florida": { lat: 28.0, lng: -82.5, zoom: 6 },
  "Other": { lat: 39.8, lng: -98.6, zoom: 4 },
};
