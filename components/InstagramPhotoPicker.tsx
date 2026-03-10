"use client";

import { useState, useEffect, useCallback } from "react";

interface InstagramMedia {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url: string;
  thumbnail_url?: string;
  caption?: string;
  timestamp: string;
  permalink: string;
}

interface InstagramPhotoPickerProps {
  onSelect: (imageUrl: string) => void;
  onCancel: () => void;
}

export default function InstagramPhotoPicker({ onSelect, onCancel }: InstagramPhotoPickerProps) {
  const [photos, setPhotos] = useState<InstagramMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const fetchPhotos = useCallback(async (after?: string) => {
    try {
      const params = new URLSearchParams({ limit: "20" });
      if (after) params.set("after", after);

      const response = await fetch(`/api/instagram/media?${params}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch photos");
      }

      const data = await response.json();
      return data;
    } catch (err) {
      throw err;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchPhotos();
        if (!cancelled) {
          setPhotos(data.data || []);
          setNextCursor(data.paging?.cursors?.after || null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load photos");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [fetchPhotos]);

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const data = await fetchPhotos(nextCursor);
      setPhotos((prev) => [...prev, ...(data.data || [])]);
      setNextCursor(data.paging?.cursors?.after || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load more photos");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleImport = async () => {
    if (!selectedPhoto) return;

    setIsImporting(true);
    try {
      // Upload the Instagram photo to our Cloudinary storage
      const response = await fetch("/api/instagram/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: selectedPhoto }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to import photo");
      }

      const data = await response.json();
      onSelect(data.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import photo");
      setIsImporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-purple-500 rounded-full animate-spin" />
        <p className="mt-2 text-sm text-gray-600">Loading your Instagram photos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm mb-3">
          {error}
        </div>
        <button
          onClick={onCancel}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Go back
        </button>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-gray-600 mb-3">No photos found on your Instagram account.</p>
        <button
          onClick={onCancel}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-black">Select a photo from Instagram</h3>
        <button
          onClick={onCancel}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>

      {/* Photo grid */}
      <div className="grid grid-cols-3 gap-1.5 max-h-64 overflow-y-auto rounded-lg">
        {photos.map((photo) => {
          const isSelected = selectedPhoto === photo.media_url;
          const displayUrl = photo.media_type === "CAROUSEL_ALBUM" && photo.thumbnail_url
            ? photo.thumbnail_url
            : photo.media_url;

          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => setSelectedPhoto(photo.media_url)}
              className={`relative aspect-square overflow-hidden rounded-md transition-all ${
                isSelected
                  ? "ring-3 ring-purple-500 ring-offset-1"
                  : "hover:opacity-80"
              }`}
            >
              <img
                src={displayUrl}
                alt={photo.caption?.slice(0, 50) || "Instagram photo"}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {isSelected && (
                <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Load more */}
      {nextCursor && (
        <button
          onClick={handleLoadMore}
          disabled={isLoadingMore}
          className="w-full py-2 text-sm text-purple-600 hover:text-purple-800 disabled:opacity-50"
        >
          {isLoadingMore ? "Loading more..." : "Load more photos"}
        </button>
      )}

      {/* Import button */}
      {selectedPhoto && (
        <button
          onClick={handleImport}
          disabled={isImporting}
          className="w-full py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          {isImporting ? "Importing..." : "Use this photo"}
        </button>
      )}
    </div>
  );
}
