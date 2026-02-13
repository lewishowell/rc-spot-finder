"use client";

import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Location, CLASSIFICATIONS } from "@/lib/types";

interface LocationMarkerProps {
  location: Location;
  icon: L.Icon | L.DivIcon;
  onClick: () => void;
  onViewDetails: () => void;
  isSelected: boolean;
}

export default function LocationMarker({ location, icon, onClick, onViewDetails, isSelected }: LocationMarkerProps) {
  const classification = CLASSIFICATIONS.find((c) => c.value === location.classification);
  const score = location.upvotes - location.downvotes;

  return (
    <Marker
      position={[location.latitude, location.longitude]}
      icon={icon}
      eventHandlers={{
        click: onClick,
      }}
    >
      <Popup>
        <div className="min-w-[200px]">
          <h3 className="font-bold text-lg mb-1">{location.name}</h3>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="px-2 py-0.5 rounded-full text-xs text-white"
              style={{ backgroundColor: classification?.color }}
            >
              {classification?.label}
            </span>
            <span className={`text-sm font-medium ${score > 0 ? "text-green-600" : score < 0 ? "text-red-600" : "text-gray-500"}`}>
              {score > 0 ? `+${score}` : score} votes
            </span>
          </div>
          {location.description && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{location.description}</p>
          )}
          {location.region && (
            <p className="text-xs text-gray-400">{location.region}</p>
          )}
          <button
            onClick={onViewDetails}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View Details
          </button>
        </div>
      </Popup>
    </Marker>
  );
}
