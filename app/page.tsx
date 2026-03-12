"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { Spot, LocationFormData, FilterOptions } from "@/lib/types";
import { parseSearchQuery, matchesSearch } from "@/lib/searchParser";
import { geocodePlace, extractPlaceQuery } from "@/lib/geocode";
import FilterPanel from "@/components/FilterPanel";
import LocationForm from "@/components/LocationForm";
import LocationCard from "@/components/LocationCard";
import SearchBox from "@/components/SearchBox";
import AuthButton from "@/components/AuthButton";
import WelcomeOverlay from "@/components/WelcomeOverlay";
import FeaturedSpots from "@/components/FeaturedSpots";
import StatsBanner from "@/components/StatsBanner";
import FeatureRequestModal from "@/components/FeatureRequestModal";
import FriendsList from "@/components/FriendsList";
import ProfileSettings from "@/components/ProfileSettings";
import RigGarage from "@/components/RigGarage";
import RigDetail from "@/components/RigDetail";
import RigForm from "@/components/RigForm";
import ModForm from "@/components/ModForm";
import UserProfilePanel from "@/components/UserProfilePanel";
import NotificationPanel from "@/components/NotificationPanel";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
      <div className="text-gray-500">Loading map...</div>
    </div>
  ),
});

export default function Home() {
  const { data: session } = useSession();
  const [locations, setLocations] = useState<Spot[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Spot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [defaultRegion, setDefaultRegion] = useState<string | null>(null);
  const [defaultRegionLoaded, setDefaultRegionLoaded] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    classification: "all",
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [formInitialData, setFormInitialData] = useState<Partial<LocationFormData>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);
  const [newMarkerPosition, setNewMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [shouldResetView, setShouldResetView] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showGeolocationPrompt, setShowGeolocationPrompt] = useState(false);
  const [showFeatureRequest, setShowFeatureRequest] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showGarage, setShowGarage] = useState(false);
  const [showRigDetail, setShowRigDetail] = useState<string | null>(null);
  const [rigDetailBackTo, setRigDetailBackTo] = useState<{ type: "profile"; userId: string } | { type: "garage" } | null>(null);
  const [showRigForm, setShowRigForm] = useState<string | null | false>(false); // false=closed, null=new, string=edit
  const [showModForm, setShowModForm] = useState<{ rigId: string; modId?: string } | null>(null);
  const [showUserProfile, setShowUserProfile] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

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
      if (filters.mySpots) {
        params.set("mySpots", "true");
      }
      if (filters.myFavorites) {
        params.set("myFavorites", "true");
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

  // Handle shared spot URL parameter (?spot=<id>)
  useEffect(() => {
    if (locations.length === 0) return;

    const urlParams = new URLSearchParams(window.location.search);
    const spotId = urlParams.get("spot");

    if (spotId) {
      const spot = locations.find((loc) => loc.id === spotId);
      if (spot) {
        setSelectedLocation(spot);
        setIsBottomSheetExpanded(true);
        // Clear the URL parameter without reloading
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [locations]);

  // Load default region on mount
  useEffect(() => {
    const loadDefaultRegion = async () => {
      if (session?.user) {
        // Try to load from API for logged-in users
        try {
          const response = await fetch("/api/user/preferences");
          if (response.ok) {
            const data = await response.json();
            if (data.defaultRegion) {
              setDefaultRegion(data.defaultRegion);
              setFilters((prev) => ({ ...prev, region: data.defaultRegion }));
            }
          }
        } catch (error) {
          console.error("Error loading preferences:", error);
        }
      } else {
        // Use localStorage for guests
        const stored = localStorage.getItem("defaultRegion");
        if (stored) {
          setDefaultRegion(stored);
          setFilters((prev) => ({ ...prev, region: stored }));
        }
      }
      setDefaultRegionLoaded(true);
    };

    loadDefaultRegion();
  }, [session?.user]);

  const handleSetDefaultRegion = useCallback(async (region: string | null) => {
    if (session?.user) {
      // Save to API for logged-in users
      try {
        const response = await fetch("/api/user/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ defaultRegion: region }),
        });
        if (response.ok) {
          setDefaultRegion(region);
        }
      } catch (error) {
        console.error("Error saving preferences:", error);
      }
    } else {
      // Save to localStorage for guests
      if (region) {
        localStorage.setItem("defaultRegion", region);
      } else {
        localStorage.removeItem("defaultRegion");
      }
      setDefaultRegion(region);
    }
  }, [session?.user]);

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
      sortBy: parsed.filters.sortBy || prev.sortBy,
      sortOrder: parsed.filters.sortOrder || prev.sortOrder,
    }));

    // On mobile, expand bottom sheet to show search results
    setIsBottomSheetExpanded(true);
  }, []);

  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null);

  // Request user location when "Near Me" sort is selected
  useEffect(() => {
    if (filters.sortBy === "distance" && !userPosition && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {} // silently fail
      );
    }
  }, [filters.sortBy, userPosition]);

  // Filter locations by search terms (name/description matching)
  const filteredLocations: Spot[] = useMemo(() => {
    let result = searchTerms.length === 0
      ? locations
      : locations.filter((loc) => matchesSearch(loc, searchTerms));

    // Client-side distance sort using Haversine formula
    if (filters.sortBy === "distance" && userPosition) {
      const toRad = (deg: number) => (deg * Math.PI) / 180;
      const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
        return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 3959; // miles
      };
      result = [...result].sort((a, b) => {
        const distA = haversine(userPosition.lat, userPosition.lng, a.latitude, a.longitude);
        const distB = haversine(userPosition.lat, userPosition.lng, b.latitude, b.longitude);
        return distA - distB;
      });
    }

    return result;
  }, [locations, searchTerms, filters.sortBy, userPosition]);

  // Extract hobby shops for the form dropdown
  const hobbyShops = useMemo(() => {
    return locations
      .filter((loc) => loc.classifications.includes("hobby"))
      .map((loc) => ({ id: loc.id, name: loc.name }));
  }, [locations]);

  // Computed values for landing page components
  const totalRegions = useMemo(() => {
    const regions = new Set(locations.map((loc) => loc.region).filter(Boolean));
    return regions.size;
  }, [locations]);

  const newestSpotName = useMemo(() => {
    if (locations.length === 0) return null;
    const sorted = [...locations].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return sorted[0]?.name ?? null;
  }, [locations]);

  const newestSpot = useMemo(() => {
    if (locations.length === 0) return null;
    const sorted = [...locations].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return sorted[0];
  }, [locations]);

  // Show geolocation prompt after welcome overlay is dismissed (for first-time visitors)
  useEffect(() => {
    if (!showWelcome && !defaultRegion && !session?.user && "geolocation" in navigator) {
      const prompted = localStorage.getItem("geoPrompted");
      if (!prompted) {
        setShowGeolocationPrompt(true);
      }
    }
  }, [showWelcome, defaultRegion, session?.user]);

  const handleGeolocation = useCallback(() => {
    localStorage.setItem("geoPrompted", "true");
    setShowGeolocationPrompt(false);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSearchLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {
        // User denied or error - just dismiss
      }
    );
  }, []);

  const handleDismissGeolocation = useCallback(() => {
    localStorage.setItem("geoPrompted", "true");
    setShowGeolocationPrompt(false);
  }, []);

  const handleWelcomeDismiss = useCallback(() => {
    setShowWelcome(false);
  }, []);

  const handleWelcomeRegionSelect = useCallback((region: string) => {
    setShowWelcome(false);
    setFilters((prev) => ({ ...prev, region }));
  }, []);

  const handleFeaturedSpotClick = useCallback((spot: Spot) => {
    setSelectedLocation(spot);
    setIsBottomSheetExpanded(true);
    setIsSidebarOpen(true);
  }, []);

  const handleFavoriteChange = useCallback((locationId: string, isFavorited: boolean, favoriteCount: number) => {
    setLocations((prev) =>
      prev.map((loc) =>
        loc.id === locationId ? { ...loc, isFavorited, favoriteCount } : loc
      )
    );
    if (selectedLocation?.id === locationId) {
      setSelectedLocation((prev) =>
        prev ? { ...prev, isFavorited, favoriteCount } : null
      );
    }
  }, [selectedLocation?.id]);

  const handleViewRigFromCard = useCallback((rigId: string) => {
    setRigDetailBackTo(null);
    setShowRigDetail(rigId);
  }, []);

  const handleVoteChange = useCallback((locationId: string, upvotes: number, downvotes: number, userVote: number | null) => {
    setLocations((prev) =>
      prev.map((loc) =>
        loc.id === locationId
          ? { ...loc, upvotes, downvotes, userVote }
          : loc
      )
    );
    if (selectedLocation?.id === locationId) {
      setSelectedLocation((prev) =>
        prev ? { ...prev, upvotes, downvotes, userVote } : null
      );
    }
  }, [selectedLocation?.id]);

  const handleMapClick = (lat: number, lng: number) => {
    // If viewing a spot or form is open, first click dismisses instead of dropping a pin
    if (selectedLocation || showForm) {
      setSelectedLocation(null);
      setShowForm(false);
      setNewMarkerPosition(null);
      setIsSidebarOpen(false);
      setIsBottomSheetExpanded(false);
      return;
    }

    // Otherwise, drop a new pin
    setFormMode("add");
    setFormInitialData({ latitude: lat, longitude: lng });
    setNewMarkerPosition({ lat, lng });
    setShowForm(true);
    setSelectedLocation(null);
    setIsBottomSheetExpanded(true);
    setIsSidebarOpen(true); // Open sidebar on desktop
  };

  const handleNewMarkerDrag = (lat: number, lng: number) => {
    setNewMarkerPosition({ lat, lng });
    setFormInitialData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
  };

  const handleMarkerClick = (location: Spot) => {
    setSelectedLocation(location);
    setShowForm(false);
    setNewMarkerPosition(null);
    setIsSidebarOpen(true); // Open sidebar on desktop
    // Don't auto-expand bottom sheet on mobile - let user see the popup first
  };

  const handleViewDetails = (location: Spot) => {
    // Briefly deselect to close the map popup, then reselect
    setSelectedLocation(null);
    setTimeout(() => {
      setSelectedLocation(location);
      setShowForm(false);
      setNewMarkerPosition(null);
      setIsBottomSheetExpanded(true); // Expand bottom sheet on mobile
      setIsSidebarOpen(true); // Open sidebar on desktop
    }, 50);
  };

  const handleHobbyShopClick = useCallback((hobbyShop: Spot) => {
    // Find the full hobby shop data from locations (it may have more details)
    const fullHobbyShop = locations.find((loc) => loc.id === hobbyShop.id) || hobbyShop;
    setSelectedLocation(fullHobbyShop);
    setShowForm(false);
    setNewMarkerPosition(null);
    setIsBottomSheetExpanded(true);
  }, [locations]);

  const handleAddNew = () => {
    setFormMode("add");
    setFormInitialData({});
    setShowForm(true);
    setSelectedLocation(null);
    setNewMarkerPosition(null);
    setIsBottomSheetExpanded(true);
  };

  const handleEdit = (location: Spot) => {
    setFormMode("edit");
    setFormInitialData({
      name: location.name,
      description: location.description || "",
      latitude: location.latitude,
      longitude: location.longitude,
      classifications: location.classifications as LocationFormData["classifications"],
      imageUrl: location.imageUrl || "",
      region: location.region || "",
      associatedHobbyShopId: location.associatedHobbyShopId || "",
    });
    setShowForm(true);
    setSelectedLocation(location);
    setNewMarkerPosition({ lat: location.latitude, lng: location.longitude });
  };

  const handleDelete = async (location: Spot) => {
    if (!confirm(`Are you sure you want to delete "${location.name}"?`)) return;

    try {
      const response = await fetch(`/api/locations/${location.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete");
      }

      setLocations((prev) => prev.filter((l) => l.id !== location.id));
      if (selectedLocation?.id === location.id) {
        setSelectedLocation(null);
      }
    } catch (error) {
      console.error("Error deleting location:", error);
      alert(error instanceof Error ? error.message : "Failed to delete location");
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
    <div className="h-full w-full flex flex-col md:flex-row overflow-hidden">
      {/* Welcome Overlay - first visit only */}
      {showWelcome && (
        <WelcomeOverlay
          onDismiss={handleWelcomeDismiss}
          onRegionSelect={handleWelcomeRegionSelect}
        />
      )}

      {/* Geolocation prompt */}
      {showGeolocationPrompt && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[1500] bg-white rounded-xl shadow-2xl border border-gray-200 p-4 max-w-sm mx-4 animate-bounce-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">Explore spots near you?</p>
              <p className="text-xs text-gray-500 mt-0.5">We&apos;ll zoom to your area to show nearby RC spots.</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleGeolocation}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  Sure!
                </button>
                <button
                  onClick={handleDismissGeolocation}
                  className="px-3 py-1.5 text-gray-500 text-xs font-medium hover:text-gray-700 transition-colors"
                >
                  No thanks
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
          autoZoomToDensest={!filters.region && !selectedLocation}
        />

        {/* Desktop sidebar toggle - stays inside map container */}
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

      {/* Mobile UI Overlay - fixed outside map container to prevent iOS issues */}
      <div className="md:hidden fixed inset-0 pointer-events-none z-[1000]" style={{ transform: "translateZ(0)" }}>
        {/* Search box and auth button */}
        <div
          className="absolute top-0 left-0 right-0 p-4 pointer-events-auto"
          style={{ paddingTop: "calc(1rem + env(safe-area-inset-top, 0px))" }}
        >
          <div className="flex gap-2 items-center">
            <img src="/logo-mobile.svg" alt="RC Spot Finder" className="h-9 flex-shrink-0" style={{ maxWidth: "90px" }} />
            <div className="flex-shrink-0">
              <AuthButton
                onOpenFriends={() => setShowFriends(true)}
                onOpenProfile={() => setShowProfileSettings(true)}
                onOpenGarage={() => setShowGarage(true)}
                onOpenNotifications={() => setShowNotifications(true)}
              />
            </div>
            <div className="flex-1">
              <SearchBox
                onSearch={handleSearch}
                placeholder="Search spots..."
              />
            </div>
          </div>
        </div>

        {/* Feature request button (mobile, logged in only) */}
        {session && (
          <button
            onClick={() => setShowFeatureRequest(true)}
            className="absolute right-4 w-10 h-10 bg-white text-gray-600 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors pointer-events-auto border border-gray-200"
            style={{ bottom: "calc(10rem + env(safe-area-inset-bottom, 0px))" }}
            title="Request a feature"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </button>
        )}

        {/* Add button */}
        <button
          onClick={handleAddNew}
          className="absolute right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors pointer-events-auto"
          style={{ bottom: "calc(5rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Desktop search box, auth, and stats - separate from mobile */}
      <div className="hidden md:flex absolute top-4 left-4 gap-3 items-start z-[1000]">
        <AuthButton
                onOpenFriends={() => setShowFriends(true)}
                onOpenProfile={() => setShowProfileSettings(true)}
                onOpenGarage={() => setShowGarage(true)}
                onOpenNotifications={() => setShowNotifications(true)}
              />
        <div className="flex flex-col gap-2">
          <div className="w-96">
            <SearchBox
              onSearch={handleSearch}
              placeholder="Try: 'bash spots in California' or 'top voted tracks'"
            />
          </div>
          {!isLoading && locations.length > 0 && (
            <StatsBanner
              totalSpots={locations.length}
              totalRegions={totalRegions}
              newestSpotName={newestSpotName}
              onNewestSpotClick={newestSpot ? () => handleFeaturedSpotClick(newestSpot) : undefined}
            />
          )}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div
        className={`hidden md:flex flex-col bg-white border-l border-gray-200 transition-all duration-300 ${
          isSidebarOpen ? "w-96" : "w-0 overflow-hidden"
        }`}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <img src="/logo.svg" alt="RC Spot Finder" className="h-10" />
            <div className="flex items-center gap-2">
              {session && (
                <button
                  onClick={() => setShowFeatureRequest(true)}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
                  title="Request a feature"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </button>
              )}
              <button
                onClick={handleAddNew}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Spot
              </button>
            </div>
          </div>
          <FilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            isOpen={isFilterOpen}
            onToggle={() => setIsFilterOpen(!isFilterOpen)}
            defaultRegion={defaultRegion}
            onSetDefaultRegion={handleSetDefaultRegion}
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
              onClick={() => setIsBottomSheetExpanded(false)}
              onEdit={() => handleEdit(selectedLocation)}
              onDelete={() => handleDelete(selectedLocation)}
              onVoteChange={handleVoteChange}
              onHobbyShopClick={handleHobbyShopClick}
              onViewProfile={(userId) => setShowUserProfile(userId)}
              onViewRig={handleViewRigFromCard}
              onFavoriteChange={handleFavoriteChange}
              isSelected
            />
          ) : (
            <>
              <p className="text-sm text-gray-500">
                {isLoading
                  ? "Loading spots..."
                  : `${filteredLocations.length} spot${filteredLocations.length !== 1 ? "s" : ""} found${searchQuery ? ` for "${searchQuery}"` : ""}. Click the map to add a new spot.`}
              </p>
              {newestSpot && !searchQuery && (
                <div className="rounded-lg border-2 border-blue-400 bg-blue-50/50 p-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-1 block">Just Added</span>
                  <LocationCard
                    location={newestSpot}
                    onClick={() => handleFeaturedSpotClick(newestSpot)}
                    onVoteChange={handleVoteChange}
                    onHobbyShopClick={handleHobbyShopClick}
                    onViewProfile={(userId) => setShowUserProfile(userId)}
                    onViewRig={handleViewRigFromCard}
                    onFavoriteChange={handleFavoriteChange}
                    isSelected={false}
                  />
                </div>
              )}
              <div className="space-y-2">
                {filteredLocations.map((loc) => (
                  <LocationCard
                    key={loc.id}
                    location={loc}
                    onClick={() => handleMarkerClick(loc)}
                    onVoteChange={handleVoteChange}
                    onViewProfile={(userId) => setShowUserProfile(userId)}
                    onFavoriteChange={handleFavoriteChange}
                    isSelected={false}
                    compact
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Featured Spots - shown for logged-out users only */}
      {!session && !isBottomSheetExpanded && !selectedLocation && !showForm && locations.length > 0 && (
        <div className="md:hidden fixed bottom-16 left-0 right-0 z-[1001]" style={{ transform: "translateZ(0)" }}>
          <FeaturedSpots spots={locations} onSpotClick={handleFeaturedSpotClick} />
        </div>
      )}

      {/* Mobile Bottom Sheet */}
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transition-all duration-300 z-[1002] pb-[env(safe-area-inset-bottom,0px)] ${
          isBottomSheetExpanded ? "h-[calc(100vh-80px)]" : "h-16"
        }`}
        style={{
          transform: "translateZ(0)",
          WebkitTransform: "translateZ(0)",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        <div
          onClick={() => setIsBottomSheetExpanded(!isBottomSheetExpanded)}
          className="w-full py-3 flex flex-col items-center cursor-pointer touch-none"
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-1" />
          <img src="/logo-mobile.svg" alt="RC Spot Finder" className="h-6 mb-1" />
          <span className="text-xs text-gray-400">
            {isBottomSheetExpanded
              ? "Swipe down to close"
              : `${filteredLocations.length} spots found`}
          </span>
        </div>

        {/* Content */}
        {isBottomSheetExpanded && (
          <div className="flex-1 overflow-y-auto px-4 pb-4 max-h-[calc(100vh-140px)]">
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
                onClick={() => setIsBottomSheetExpanded(false)}
                onEdit={() => handleEdit(selectedLocation)}
                onDelete={() => handleDelete(selectedLocation)}
                onVoteChange={handleVoteChange}
                onHobbyShopClick={handleHobbyShopClick}
                onViewProfile={(userId) => setShowUserProfile(userId)}
                onViewRig={handleViewRigFromCard}
                onFavoriteChange={handleFavoriteChange}
                isSelected
              />
            ) : (
              <div className="space-y-3">
                <FilterPanel
                  filters={filters}
                  onFiltersChange={setFilters}
                  isOpen={isFilterOpen}
                  onToggle={() => setIsFilterOpen(!isFilterOpen)}
                  defaultRegion={defaultRegion}
                  onSetDefaultRegion={handleSetDefaultRegion}
                />
                {newestSpot && !searchQuery && (
                  <div className="rounded-lg border-2 border-blue-400 bg-blue-50/50 p-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-1 block">Just Added</span>
                    <LocationCard
                      location={newestSpot}
                      onClick={() => handleFeaturedSpotClick(newestSpot)}
                      onVoteChange={handleVoteChange}
                      onHobbyShopClick={handleHobbyShopClick}
                      onViewProfile={(userId) => setShowUserProfile(userId)}
                      onViewRig={handleViewRigFromCard}
                      onFavoriteChange={handleFavoriteChange}
                      isSelected={false}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  {filteredLocations.map((loc) => (
                    <LocationCard
                      key={loc.id}
                      location={loc}
                      onClick={() => handleMarkerClick(loc)}
                      onVoteChange={handleVoteChange}
                      onViewProfile={(userId) => setShowUserProfile(userId)}
                      onFavoriteChange={handleFavoriteChange}
                      isSelected={false}
                      compact
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Feature Request Modal */}
      {showFeatureRequest && (
        <FeatureRequestModal onClose={() => setShowFeatureRequest(false)} />
      )}

      {/* Friends Panel */}
      {showFriends && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowFriends(false)} />
          <div className="relative z-10 mx-4 max-h-[80vh]">
            <FriendsList
              onClose={() => setShowFriends(false)}
              onViewProfile={(userId) => { setShowFriends(false); setShowUserProfile(userId); }}
            />
          </div>
        </div>
      )}

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNotifications(false)} />
          <div className="relative z-10 mx-4 max-h-[80vh]">
            <NotificationPanel
              onClose={() => setShowNotifications(false)}
              onViewSpot={(spotId) => {
                setShowNotifications(false);
                const spot = locations.find((l) => l.id === spotId);
                if (spot) {
                  setSelectedLocation(spot);
                  setIsBottomSheetExpanded(true);
                  setIsSidebarOpen(true);
                }
              }}
              onViewRig={(rigId) => {
                setShowNotifications(false);
                setRigDetailBackTo(null);
                setShowRigDetail(rigId);
              }}
              onViewProfile={(userId) => {
                setShowNotifications(false);
                setShowUserProfile(userId);
              }}
              onViewFriends={() => {
                setShowNotifications(false);
                setShowFriends(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Profile Settings Modal */}
      {showProfileSettings && (
        <ProfileSettings onClose={() => setShowProfileSettings(false)} />
      )}

      {/* User Profile Panel */}
      {showUserProfile && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowUserProfile(null)} />
          <div className="relative z-10 mx-4 max-h-[80vh]">
            <UserProfilePanel
              userId={showUserProfile}
              onClose={() => setShowUserProfile(null)}
              onViewRig={(rigId) => { setRigDetailBackTo({ type: "profile", userId: showUserProfile }); setShowUserProfile(null); setShowRigDetail(rigId); }}
            />
          </div>
        </div>
      )}

      {/* Garage Panel */}
      {showGarage && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowGarage(false)} />
          <div className="relative z-10 w-full max-w-lg mx-4 max-h-[80vh] bg-white rounded-xl shadow-2xl overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">My Garage</h2>
              <button onClick={() => setShowGarage(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <RigGarage
              isOwner
              onRigClick={(rigId) => { setRigDetailBackTo({ type: "garage" }); setShowGarage(false); setShowRigDetail(rigId); }}
              onAddRig={() => { setShowGarage(false); setShowRigForm(null); }}
            />
          </div>
        </div>
      )}

      {/* Rig Detail */}
      {showRigDetail && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRigDetail(null)} />
          <div className="relative z-10 w-full max-w-md mx-4 max-h-[80vh] bg-white rounded-xl shadow-2xl overflow-y-auto p-6">
            <RigDetail
              rigId={showRigDetail}
              onClose={() => {
                const backTo = rigDetailBackTo;
                setShowRigDetail(null);
                setRigDetailBackTo(null);
                if (backTo?.type === "profile") {
                  setShowUserProfile(backTo.userId);
                } else if (backTo?.type === "garage") {
                  setShowGarage(true);
                }
              }}
              onEdit={() => { setShowRigForm(showRigDetail); setShowRigDetail(null); }}
              onAddMod={() => { setShowModForm({ rigId: showRigDetail }); }}
              onEditMod={(modId) => { setShowModForm({ rigId: showRigDetail, modId }); }}
            />
          </div>
        </div>
      )}

      {/* Rig Form (add/edit) */}
      {showRigForm !== false && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRigForm(false)} />
          <div className="relative z-10 w-full max-w-md mx-4 max-h-[80vh] bg-white rounded-xl shadow-2xl overflow-y-auto p-6">
            <RigForm
              rigId={showRigForm || undefined}
              onClose={() => setShowRigForm(false)}
              onSaved={() => { setShowRigForm(false); setShowGarage(true); }}
            />
          </div>
        </div>
      )}

      {/* Mod Form (add/edit) */}
      {showModForm && (
        <div className="fixed inset-0 z-[2200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModForm(null)} />
          <div className="relative z-10 w-full max-w-sm mx-4 bg-white rounded-xl shadow-2xl overflow-y-auto p-6">
            <ModForm
              rigId={showModForm.rigId}
              modId={showModForm.modId}
              onClose={() => setShowModForm(null)}
              onSaved={() => { setShowModForm(null); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
