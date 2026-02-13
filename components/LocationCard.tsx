"use client";

import { useState, useEffect, useRef } from "react";
import { Location, CLASSIFICATIONS } from "@/lib/types";
import VoteButtons from "./VoteButtons";

interface LocationCardProps {
  location: Location;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isSelected?: boolean;
  compact?: boolean;
  onVoteChange?: (locationId: string, upvotes: number, downvotes: number, userVote: number | null) => void;
  onHobbyShopClick?: (hobbyShop: Location) => void;
}

export default function LocationCard({
  location,
  onClick,
  onEdit,
  onDelete,
  isSelected = false,
  compact = false,
  onVoteChange,
  onHobbyShopClick,
}: LocationCardProps) {
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared">("idle");
  const [isHighlighted, setIsHighlighted] = useState(false);
  const prevLocationId = useRef<string | null>(null);
  const classification = CLASSIFICATIONS.find((c) => c.value === location.classification);

  // Trigger highlight animation when a new location is selected (non-compact view only)
  useEffect(() => {
    if (isSelected && !compact && location.id !== prevLocationId.current) {
      setIsHighlighted(true);
      const timer = setTimeout(() => setIsHighlighted(false), 1000);
      prevLocationId.current = location.id;
      return () => clearTimeout(timer);
    }
  }, [location.id, isSelected, compact]);

  const handleVoteChange = (upvotes: number, downvotes: number, userVote: number | null) => {
    if (onVoteChange) {
      onVoteChange(location.id, upvotes, downvotes, userVote);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const shareUrl = `${window.location.origin}?spot=${location.id}`;
    const shareData = {
      title: location.name,
      text: `Check out ${location.name} on RC Spot Finder!`,
      url: shareUrl,
    };

    // Try native share API first (iOS, Android, some desktop browsers)
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        setShareStatus("shared");
      } catch (err) {
        // User cancelled or share failed, fall back to clipboard
        if ((err as Error).name !== "AbortError") {
          await copyToClipboard(shareUrl);
        }
      }
    } else {
      // Fall back to clipboard
      await copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus("copied");
      setTimeout(() => setShareStatus("idle"), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setShareStatus("copied");
      setTimeout(() => setShareStatus("idle"), 2000);
    }
  };

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
          isSelected
            ? "border-blue-500 bg-blue-50"
            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">{location.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="px-2 py-0.5 rounded-full text-xs text-white"
                style={{ backgroundColor: classification?.color }}
              >
                {classification?.label}
              </span>
              <div onClick={(e) => e.stopPropagation()}>
                <VoteButtons
                  locationId={location.id}
                  upvotes={location.upvotes}
                  downvotes={location.downvotes}
                  userVote={location.userVote}
                  onVoteChange={handleVoteChange}
                  size="sm"
                />
              </div>
            </div>
          </div>
          {location.imageUrl && (
            <img
              src={location.imageUrl}
              alt={location.name}
              className="w-12 h-12 object-cover rounded flex-shrink-0"
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-lg border overflow-hidden transition-all duration-300 ${
        isSelected ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200"
      } ${isHighlighted ? "ring-4 ring-blue-400 ring-opacity-75 animate-pulse" : ""}`}
    >
      {location.imageUrl && (
        <img
          src={location.imageUrl}
          alt={location.name}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-lg text-gray-900">{location.name}</h3>
          <span
            className="px-2 py-1 rounded-full text-xs text-white flex-shrink-0"
            style={{ backgroundColor: classification?.color }}
          >
            {classification?.label}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <VoteButtons
            locationId={location.id}
            upvotes={location.upvotes}
            downvotes={location.downvotes}
            userVote={location.userVote}
            onVoteChange={handleVoteChange}
            size="md"
          />
          {location.region && (
            <span className="text-sm text-gray-500">• {location.region}</span>
          )}
        </div>

        {location.description && (
          <p className="text-gray-600 text-sm mb-4">{location.description}</p>
        )}

        {location.associatedHobbyShop && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onHobbyShopClick && location.associatedHobbyShop) {
                onHobbyShopClick(location.associatedHobbyShop as Location);
              }
            }}
            className="w-full flex items-center gap-2 mb-3 p-2 bg-orange-50 rounded-md hover:bg-orange-100 transition-colors text-left"
          >
            <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-sm text-orange-700">
              Nearest Shop: <span className="font-medium underline">{location.associatedHobbyShop.name}</span>
            </span>
            <svg className="w-4 h-4 text-orange-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {location.user?.name && (
          <div className="text-xs text-gray-500 mb-2">
            Added by: {location.user.name}
          </div>
        )}

        <div className="text-xs text-gray-400 mb-4">
          <div className="flex items-center gap-2">
            <p>
              Coordinates: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </p>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-blue-500 hover:text-blue-700 transition-colors"
              title="Get directions"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </a>
          </div>
          <p>Added: {new Date(location.createdAt).toLocaleDateString()}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClick}
            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            View on Map
          </button>
          <button
            onClick={handleShare}
            className="px-3 py-2 bg-white border-2 border-gray-500 text-sm rounded-md hover:bg-gray-50 transition-colors flex items-center gap-1"
            title="Share this spot"
          >
            {shareStatus === "copied" ? (
              <>
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-600 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span className="text-black font-medium">Share</span>
              </>
            )}
          </button>
          {location.isOwner && onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
            >
              Edit
            </button>
          )}
          {location.isOwner && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="px-3 py-2 border border-red-300 text-red-600 text-sm rounded-md hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
