"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { Location, LocationFormData, FilterOptions } from "@/lib/types";
import { parseSearchQuery, matchesSearch } from "@/lib/searchParser";
import { geocodePlace, extractPlaceQuery } from "@/lib/geocode";
import FilterPanel from "@/components/FilterPanel";
import LocationForm from "@/components/LocationForm";
import LocationCard from "@/components/LocationCard";
import SearchBox from "@/components/SearchBox";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
      <div className="text-gray-500">Loading map...</div>
    </div>
  ),
});

export default function Home() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    classification: "all",
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [formInitialData, setFormInitialData] = useState<Partial<LocationFormData>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);
  const [newMarkerPosition, setNewMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [shouldResetView, setShouldResetView] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Touch handling for bottom sheet swipe
  const touchStartY = useRef<number>(0);
  const touchCurrentY = useRef<number>(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchCurrentY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const deltaY = touchCurrentY.current - touchStartY.current;
    // Swipe down to collapse (if expanded)
    if (deltaY > 50 && isBottomSheetExpanded) {
      setIsBottomSheetExpanded(false);
    }
    // Swipe up to expand (if collapsed)
    if (deltaY < -50 && !isBottomSheetExpanded) {
      setIsBottomSheetExpanded(true);
    }
  }, [isBottomSheetExpanded]);

  const fetchLocations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.classification && filters.classification !== "all") {
        params.set("classification", filters.classification);
      }
      if (filters.region) {
        params.set("region", filters.region);
      }
      if (filters.sortBy) {
        params.set("sortBy", filters.sortBy);
      }
      if (filters.sortOrder) {
        params.set("sortOrder", filters.sortOrder);
      }

      const response = await fetch(`/api/locations?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setLocations(data);
    } catch (error) {
      console.error("Error fetching locations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      // Clear search - reset filters
      setSearchTerms([]);
      setSearchLocation(null);
      setFilters({
        classification: "all",
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      setShouldResetView(true);
      setTimeout(() => setShouldResetView(false), 100);
      return;
    }

    // Check for place query first (e.g., "bend, oregon")
    const placeQuery = extractPlaceQuery(query);
    let geocodedPlace = false;

    if (placeQuery) {
      const result = await geocodePlace(placeQuery);
      if (result) {
        setSearchLocation({ lat: result.lat, lng: result.lng });
        geocodedPlace = true;
      } else {
        setSearchLocation(null);
      }
    } else {
      setSearchLocation(null);
    }

    const parsed = parseSearchQuery(query);

    // Only use search terms for client-side filtering if no classification/region filters were detected
    const hasFilters = parsed.filters.classification || parsed.filters.region;
    setSearchTerms(hasFilters ? [] : parsed.searchTerms);

    // Apply parsed filters
    // If we geocoded a specific place, don't apply region filter - the map zoom handles showing the area
    setFilters((prev) => ({
      ...prev,
      classification: parsed.filters.classification || "all",
      region: geocodedPlace ? undefined : parsed.filters.region,
    }));

    // On mobile, expand bottom sheet to show search results
    setIsBottomSheetExpanded(true);
  }, []);

  // Filter locations by search terms (name/description matching)
  const filteredLocations = useMemo(() => {
    if (searchTerms.length === 0) {
      return locations;
    }
    return locations.filter((loc) => matchesSearch(loc, searchTerms));
  }, [locations, searchTerms]);

  // Extract hobby shops for the form dropdown
  const hobbyShops = useMemo(() => {
    return locations
      .filter((loc) => loc.classification === "hobby")
      .map((loc) => ({ id: loc.id, name: loc.name }));
  }, [locations]);

  const handleMapClick = (lat: number, lng: number) => {
    setFormMode("add");
    setFormInitialData({ latitude: lat, longitude: lng });
    setNewMarkerPosition({ lat, lng });
    setShowForm(true);
    setSelectedLocation(null);
    setIsBottomSheetExpanded(true);
  };

  const handleNewMarkerDrag = (lat: number, lng: number) => {
    setNewMarkerPosition({ lat, lng });
    setFormInitialData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
  };

  const handleMarkerClick = (location: Location) => {
    setSelectedLocation(location);
    setShowForm(false);
    setNewMarkerPosition(null);
    // Don't auto-expand bottom sheet on mobile - let user see the popup first
  };

  const handleViewDetails = (location: Location) => {
    setSelectedLocation(location);
    setShowForm(false);
    setNewMarkerPosition(null);
    setIsBottomSheetExpanded(true); // Expand bottom sheet to show details
  };

  const handleAddNew = () => {
    setFormMode("add");
    setFormInitialData({});
    setShowForm(true);
    setSelectedLocation(null);
    setNewMarkerPosition(null);
  };

  const handleEdit = (location: Location) => {
    setFormMode("edit");
    setFormInitialData({
      name: location.name,
      description: location.description || "",
      latitude: location.latitude,
      longitude: location.longitude,
      classification: location.classification as LocationFormData["classification"],
      rating: location.rating,
      imageUrl: location.imageUrl || "",
      region: location.region || "",
      associatedHobbyShopId: location.associatedHobbyShopId || "",
    });
    setShowForm(true);
    setSelectedLocation(location);
    setNewMarkerPosition({ lat: location.latitude, lng: location.longitude });
  };

  const handleDelete = async (location: Location) => {
    if (!confirm(`Are you sure you want to delete "${location.name}"?`)) return;

    try {
      const response = await fetch(`/api/locations/${location.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      setLocations((prev) => prev.filter((l) => l.id !== location.id));
      if (selectedLocation?.id === location.id) {
        setSelectedLocation(null);
      }
    } catch (error) {
      console.error("Error deleting location:", error);
      alert("Failed to delete location");
    }
  };

  const handleFormSubmit = async (data: LocationFormData) => {
    const url = formMode === "edit" && selectedLocation
      ? `/api/locations/${selectedLocation.id}`
      : "/api/locations";
    const method = formMode === "edit" ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to save");
    }

    const savedLocation = await response.json();

    if (formMode === "edit") {
      setLocations((prev) =>
        prev.map((l) => (l.id === savedLocation.id ? savedLocation : l))
      );
    } else {
      setLocations((prev) => [savedLocation, ...prev]);
    }

    setShowForm(false);
    setNewMarkerPosition(null);
    setSelectedLocation(savedLocation);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setNewMarkerPosition(null);
    if (formMode === "add") {
      setSelectedLocation(null);
    }
  };

  const handlePositionChange = (lat: number, lng: number) => {
    setNewMarkerPosition({ lat, lng });
  };

  const handleBackToList = () => {
    setShowForm(false);
    setSelectedLocation(null);
    setNewMarkerPosition(null);
    setShouldResetView(true);
    // Reset the flag after a short delay
    setTimeout(() => setShouldResetView(false), 100);
  };

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row overflow-hidden">
      {/* Map Container */}
      <div className="flex-1 relative">
        <Map
          locations={filteredLocations}
          onMapClick={handleMapClick}
          onMarkerClick={handleMarkerClick}
          onViewDetails={handleViewDetails}
          selectedLocation={selectedLocation}
          newMarkerPosition={newMarkerPosition}
          onNewMarkerDrag={handleNewMarkerDrag}
          resetView={shouldResetView}
          selectedRegion={filters.region}
          editingLocationId={showForm && formMode === "edit" ? selectedLocation?.id : undefined}
          searchLocation={searchLocation}
        />

        {/* Floating search box */}
        <div className="absolute top-4 left-4 right-4 md:right-auto md:w-96 z-[1000]">
          <SearchBox
            onSearch={handleSearch}
            placeholder="Try: 'bash spots in California' or '5 star tracks'"
          />
        </div>

        {/* Add button - mobile */}
        <button
          onClick={handleAddNew}
          className="md:hidden absolute bottom-24 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center z-[1000] hover:bg-blue-700 transition-colors"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* Sidebar toggle - desktop */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="hidden md:flex absolute top-4 right-4 w-10 h-10 bg-white rounded-lg shadow-lg items-center justify-center z-[1000] hover:bg-gray-50 transition-colors"
        >
          <svg
            className={`w-5 h-5 text-gray-600 transition-transform ${isSidebarOpen ? "" : "rotate-180"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div
        className={`hidden md:flex flex-col bg-white border-l border-gray-200 transition-all duration-300 ${
          isSidebarOpen ? "w-96" : "w-0 overflow-hidden"
        }`}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900">RC Spot Finder</h1>
            <button
              onClick={handleAddNew}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              Add Spot
            </button>
          </div>
          <FilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            isOpen={isFilterOpen}
            onToggle={() => setIsFilterOpen(!isFilterOpen)}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {(showForm || selectedLocation) && (
            <button
              onClick={handleBackToList}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to all spots
            </button>
          )}
          {showForm ? (
            <LocationForm
              key={`${formInitialData.latitude}-${formInitialData.longitude}`}
              initialData={formInitialData}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              onPositionChange={handlePositionChange}
              isEdit={formMode === "edit"}
              hobbyShops={hobbyShops}
            />
          ) : selectedLocation ? (
            <LocationCard
              location={selectedLocation}
              onClick={() => {}}
              onEdit={() => handleEdit(selectedLocation)}
              onDelete={() => handleDelete(selectedLocation)}
              isSelected
            />
          ) : (
            <>
              <p className="text-sm text-gray-500">
                {isLoading
                  ? "Loading spots..."
                  : `${filteredLocations.length} spot${filteredLocations.length !== 1 ? "s" : ""} found${searchQuery ? ` for "${searchQuery}"` : ""}. Click the map to add a new spot.`}
              </p>
              <div className="space-y-2">
                {filteredLocations.map((location) => (
                  <LocationCard
                    key={location.id}
                    location={location}
                    onClick={() => handleMarkerClick(location)}
                    isSelected={selectedLocation?.id === location.id}
                    compact
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Bottom Sheet */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 z-[1001] ${
          isBottomSheetExpanded ? "h-[70vh]" : "h-16"
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        <div
          onClick={() => setIsBottomSheetExpanded(!isBottomSheetExpanded)}
          className="w-full py-3 flex flex-col items-center cursor-pointer touch-none"
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-2" />
          <span className="text-sm text-gray-600">
            {isBottomSheetExpanded
              ? "Swipe down to close"
              : `${filteredLocations.length} spots found`}
          </span>
        </div>

        {/* Content */}
        {isBottomSheetExpanded && (
          <div className="flex-1 overflow-y-auto px-4 pb-4 h-[calc(70vh-60px)]">
            {(showForm || selectedLocation) && (
              <button
                onClick={handleBackToList}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to all spots
              </button>
            )}
            {showForm ? (
              <LocationForm
                key={`mobile-${formInitialData.latitude}-${formInitialData.longitude}`}
                initialData={formInitialData}
                onSubmit={handleFormSubmit}
                onCancel={handleFormCancel}
                onPositionChange={handlePositionChange}
                isEdit={formMode === "edit"}
                hobbyShops={hobbyShops}
              />
            ) : selectedLocation ? (
              <LocationCard
                location={selectedLocation}
                onClick={() => {}}
                onEdit={() => handleEdit(selectedLocation)}
                onDelete={() => handleDelete(selectedLocation)}
                isSelected
              />
            ) : (
              <div className="space-y-3">
                <FilterPanel
                  filters={filters}
                  onFiltersChange={setFilters}
                  isOpen={isFilterOpen}
                  onToggle={() => setIsFilterOpen(!isFilterOpen)}
                />
                <div className="space-y-2">
                  {filteredLocations.map((location) => (
                    <LocationCard
                      key={location.id}
                      location={location}
                      onClick={() => handleMarkerClick(location)}
                      isSelected={selectedLocation?.id === location.id}
                      compact
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
