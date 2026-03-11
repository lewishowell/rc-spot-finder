"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

interface SpotPhoto {
  id: string;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
}

interface SpotPhotoGalleryProps {
  locationId: string;
  spotOwnerId: string;
  coverImageUrl?: string | null;
  onViewProfile?: (userId: string) => void;
}

export default function SpotPhotoGallery({ locationId, spotOwnerId, coverImageUrl, onViewProfile }: SpotPhotoGalleryProps) {
  const { data: session } = useSession();
  const [photos, setPhotos] = useState<SpotPhoto[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState<SpotPhoto | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPhotos = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/locations/${locationId}/photos`);
      if (res.ok) {
        setPhotos(await res.json());
      }
    } catch (err) {
      console.error("Error fetching photos:", err);
    } finally {
      setIsLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    if (isOpen) fetchPhotos();
  }, [isOpen, fetchPhotos]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setUploadedUrl(data.url);
      }
    } catch (err) {
      console.error("Error uploading:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedUrl || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/locations/${locationId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: uploadedUrl, caption: caption.trim() || null }),
      });
      if (res.ok) {
        const newPhoto = await res.json();
        setPhotos((prev) => [newPhoto, ...prev]);
        setShowUpload(false);
        setCaption("");
        setUploadedUrl("");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add photo");
      }
    } catch (err) {
      console.error("Error adding photo:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm("Delete this photo?")) return;

    try {
      const res = await fetch(`/api/locations/${locationId}/photos`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId }),
      });
      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        if (expandedPhoto?.id === photoId) setExpandedPhoto(null);
      }
    } catch (err) {
      console.error("Error deleting photo:", err);
    }
  };

  const canDelete = (photo: SpotPhoto) => {
    if (!session?.user?.id) return false;
    return photo.user.id === session.user.id || spotOwnerId === session.user.id;
  };

  const totalPhotos = photos.length + (coverImageUrl ? 1 : 0);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="border-t border-gray-100 pt-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {isOpen ? totalPhotos : photos.length > 0 ? totalPhotos : 0} photo{totalPhotos !== 1 ? "s" : ""}
        <svg className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-2 space-y-2">
          {/* Upload button */}
          {session && !showUpload && (
            <button
              onClick={() => setShowUpload(true)}
              className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-md text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              + Add a photo
            </button>
          )}

          {/* Upload form */}
          {showUpload && (
            <form onSubmit={handleSubmitPhoto} className="p-3 bg-gray-50 rounded-md space-y-2">
              {!uploadedUrl ? (
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-blue-400 transition-colors">
                  {isUploading ? (
                    <span className="text-sm text-gray-400">Uploading...</span>
                  ) : (
                    <>
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="text-xs text-gray-400 mt-1">Choose a photo</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                </label>
              ) : (
                <img src={uploadedUrl} alt="Preview" className="w-full h-32 object-cover rounded-md" />
              )}
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Caption (optional)"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!uploadedUrl || isSubmitting}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? "Adding..." : "Add Photo"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowUpload(false); setUploadedUrl(""); setCaption(""); }}
                  className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Photo grid */}
          {isLoading ? (
            <p className="text-xs text-gray-400">Loading photos...</p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {coverImageUrl && (
                <div className="relative aspect-square group">
                  <img
                    src={coverImageUrl}
                    alt="Cover"
                    className="w-full h-full object-cover rounded cursor-pointer"
                    onClick={() => setExpandedPhoto({ id: "cover", imageUrl: coverImageUrl, caption: "Cover photo", createdAt: "", user: { id: spotOwnerId, name: null, username: null, image: null } })}
                  />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[9px] text-white font-medium">
                    Cover
                  </div>
                </div>
              )}
              {photos.map((photo) => (
                <div key={photo.id} className="relative aspect-square group">
                  <img
                    src={photo.imageUrl}
                    alt={photo.caption || "Spot photo"}
                    className="w-full h-full object-cover rounded cursor-pointer"
                    onClick={() => setExpandedPhoto(photo)}
                  />
                </div>
              ))}
            </div>
          )}

          {!isLoading && photos.length === 0 && !coverImageUrl && (
            <p className="text-xs text-gray-400">No photos yet. Be the first to add one!</p>
          )}
        </div>
      )}

      {/* Expanded photo overlay */}
      {expandedPhoto && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80" onClick={() => setExpandedPhoto(null)}>
          <div className="relative max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={expandedPhoto.imageUrl}
              alt={expandedPhoto.caption || "Spot photo"}
              className="w-full max-h-[70vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setExpandedPhoto(null)}
              className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="mt-2 px-1">
              {expandedPhoto.caption && (
                <p className="text-white text-sm mb-1">{expandedPhoto.caption}</p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {expandedPhoto.user.image && (
                    <img src={expandedPhoto.user.image} alt="" className="w-5 h-5 rounded-full" />
                  )}
                  <button
                    onClick={() => { setExpandedPhoto(null); onViewProfile?.(expandedPhoto.user.id); }}
                    className="text-xs text-gray-300 hover:text-white transition-colors"
                  >
                    {expandedPhoto.user.username ? `@${expandedPhoto.user.username}` : expandedPhoto.user.name || ""}
                  </button>
                  {expandedPhoto.createdAt && (
                    <span className="text-xs text-gray-500">{timeAgo(expandedPhoto.createdAt)}</span>
                  )}
                </div>
                {expandedPhoto.id !== "cover" && canDelete(expandedPhoto) && (
                  <button
                    onClick={() => handleDelete(expandedPhoto.id)}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
