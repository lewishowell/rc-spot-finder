"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { Location, Classification, REGION_COORDINATES } from "@/lib/types";
import LocationMarker from "./LocationMarker";

interface MapProps {
  locations: Location[];
  onMapClick: (lat: number, lng: number) => void;
  onMarkerClick: (location: Location) => void;
  onViewDetails: (location: Location) => void;
  selectedLocation: Location | null;
  newMarkerPosition: { lat: number; lng: number } | null;
  onNewMarkerDrag: (lat: number, lng: number) => void;
  resetView?: boolean;
  selectedRegion?: string;
  editingLocationId?: string;
  searchLocation?: { lat: number; lng: number } | null;
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyToLocation({ location }: { location: Location | null }) {
  const map = useMap();
  const prevLocationRef = useRef<string | null>(null);

  useEffect(() => {
    if (location && location.id !== prevLocationRef.current) {
      prevLocationRef.current = location.id;
      map.flyTo([location.latitude, location.longitude], 14, {
        duration: 0.5,
      });
    } else if (!location) {
      prevLocationRef.current = null;
    }
  }, [location, map]);

  return null;
}

function FlyToPosition({ position }: { position: { lat: number; lng: number } | null }) {
  const map = useMap();
  const initialFlyDone = useRef(false);

  useEffect(() => {
    if (position && !initialFlyDone.current) {
      initialFlyDone.current = true;
      map.flyTo([position.lat, position.lng], Math.max(map.getZoom(), 12), {
        duration: 0.5,
      });
    } else if (!position) {
      initialFlyDone.current = false;
    }
  }, [position, map]);

  return null;
}

function ResetMapView({ resetView }: { resetView?: boolean }) {
  const map = useMap();
  const hasReset = useRef(false);

  useEffect(() => {
    if (resetView && !hasReset.current) {
      hasReset.current = true;
      map.flyTo([39.8283, -98.5795], 4, {
        duration: 0.5,
      });
    } else if (!resetView) {
      hasReset.current = false;
    }
  }, [resetView, map]);

  return null;
}

function FlyToRegion({ region }: { region?: string }) {
  const map = useMap();
  const prevRegion = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (region && region !== prevRegion.current && REGION_COORDINATES[region]) {
      prevRegion.current = region;
      const coords = REGION_COORDINATES[region];
      map.flyTo([coords.lat, coords.lng], coords.zoom, {
        duration: 0.5,
      });
    } else if (!region) {
      prevRegion.current = undefined;
    }
  }, [region, map]);

  return null;
}

function FlyToSearchLocation({ location }: { location?: { lat: number; lng: number } | null }) {
  const map = useMap();
  const prevLocation = useRef<string | null>(null);

  useEffect(() => {
    if (location) {
      const key = `${location.lat},${location.lng}`;
      if (key !== prevLocation.current) {
        prevLocation.current = key;
        // Zoom level 9 is approximately 100 mile radius
        map.flyTo([location.lat, location.lng], 9, {
          duration: 0.5,
        });
      }
    } else {
      prevLocation.current = null;
    }
  }, [location, map]);

  return null;
}

function MapResizer() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    let isAnimating = false;

    // Track when map is animating to avoid resize during animation
    const onMoveStart = () => { isAnimating = true; };
    const onMoveEnd = () => {
      isAnimating = false;
      // Invalidate size after animation completes
      setTimeout(() => map.invalidateSize({ pan: false }), 50);
    };

    map.on("movestart", onMoveStart);
    map.on("moveend", onMoveEnd);

    const resizeObserver = new ResizeObserver(() => {
      if (!isAnimating) {
        map.invalidateSize({ pan: false });
      }
    });

    resizeObserver.observe(container);

    // Handle window resize with debounce
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (!isAnimating) {
          map.invalidateSize({ pan: false });
        }
      }, 150);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
      map.off("movestart", onMoveStart);
      map.off("moveend", onMoveEnd);
      clearTimeout(resizeTimeout);
    };
  }, [map]);

  return null;
}

function getMarkerIcon(classification: Classification): L.DivIcon {
  const colors: Record<Classification, string> = {
    bash: "#ef4444",
    race: "#3b82f6",
    crawl: "#22c55e",
    hobby: "#f97316",
    airfield: "#8b5cf6",
  };

  const color = colors[classification];

  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <path fill="${color}" stroke="#fff" stroke-width="1" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle fill="#fff" cx="12" cy="9" r="2.5"/>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: "custom-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

function getNewMarkerIcon(): L.DivIcon {
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40">
      <path fill="#8b5cf6" stroke="#fff" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle fill="#fff" cx="12" cy="9" r="3"/>
      <line x1="12" y1="6" x2="12" y2="12" stroke="#8b5cf6" stroke-width="1.5"/>
      <line x1="9" y1="9" x2="15" y2="9" stroke="#8b5cf6" stroke-width="1.5"/>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: "new-marker",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });
}

interface DraggableNewMarkerProps {
  position: { lat: number; lng: number };
  onDrag: (lat: number, lng: number) => void;
}

function DraggableNewMarker({ position, onDrag }: DraggableNewMarkerProps) {
  const icon = useMemo(() => getNewMarkerIcon(), []);

  const eventHandlers = useMemo(
    () => ({
      dragend: (e: L.DragEndEvent) => {
        const marker = e.target;
        const pos = marker.getLatLng();
        onDrag(pos.lat, pos.lng);
      },
    }),
    [onDrag]
  );

  return (
    <Marker
      position={[position.lat, position.lng]}
      icon={icon}
      draggable={true}
      eventHandlers={eventHandlers}
    />
  );
}

type MapType = "map" | "satellite";


function MapContent({
  locations,
  onMapClick,
  onMarkerClick,
  onViewDetails,
  selectedLocation,
  newMarkerPosition,
  onNewMarkerDrag,
  resetView,
  selectedRegion,
  editingLocationId,
  searchLocation,
  mapType,
}: MapProps & { mapType: MapType }) {
  return (
    <>
      {mapType === "map" ? (
        <TileLayer
          key="osm"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      ) : (
        <>
          <TileLayer
            key="satellite"
            attribution='Tiles &copy; Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
          <TileLayer
            key="roads-overlay"
            attribution='Labels &copy; Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
          />
          <TileLayer
            key="labels-overlay"
            attribution=''
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          />
        </>
      )}
      <MapClickHandler onMapClick={onMapClick} />
      <FlyToLocation location={selectedLocation} />
      <FlyToPosition position={newMarkerPosition} />
      <ResetMapView resetView={resetView} />
      <FlyToRegion region={selectedRegion} />
      <FlyToSearchLocation location={searchLocation} />
      <MapResizer />
      {locations
        .filter((location) => location.id !== editingLocationId)
        .map((location) => (
        <LocationMarker
          key={location.id}
          location={location}
          icon={getMarkerIcon(location.classification as Classification)}
          onClick={() => onMarkerClick(location)}
          onViewDetails={() => onViewDetails(location)}
          isSelected={selectedLocation?.id === location.id}
        />
      ))}
      {newMarkerPosition && (
        <DraggableNewMarker
          position={newMarkerPosition}
          onDrag={onNewMarkerDrag}
        />
      )}
    </>
  );
}

export default function Map(props: MapProps) {
  const [isClient, setIsClient] = useState(false);
  const [mapType, setMapType] = useState<MapType>("map");

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleMapTypeToggle = useCallback(() => {
    setMapType((prev) => (prev === "map" ? "satellite" : "map"));
  }, []);

  if (!isClient) {
    return (
      <div className="relative w-full h-full" suppressHydrationWarning>
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <div className="text-gray-500">Loading map...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full" suppressHydrationWarning>
      <MapContainer
        key="main-map"
        center={[39.8283, -98.5795]}
        zoom={4}
        className="w-full h-full"
        zoomControl={false}
      >
        <MapContent {...props} mapType={mapType} />
      </MapContainer>

      {/* Map/Satellite Toggle - positioned above bottom sheet on mobile */}
      <div className="absolute bottom-20 md:bottom-6 left-4 z-[1000]">
        <button
          onClick={handleMapTypeToggle}
          className="bg-white px-3 py-2 md:px-4 md:py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-2 rounded-lg shadow-lg border border-gray-300"
          title={mapType === "map" ? "Switch to Satellite" : "Switch to Map"}
        >
          {mapType === "map" ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Satellite
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Map
            </>
          )}
        </button>
      </div>
    </div>
  );
}
