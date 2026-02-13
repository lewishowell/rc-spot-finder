"use client";

import { useState, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import { LocationFormData, CLASSIFICATIONS, REGIONS } from "@/lib/types";

interface HobbyShop {
  id: string;
  name: string;
}

interface LocationFormProps {
  initialData?: Partial<LocationFormData>;
  onSubmit: (data: LocationFormData) => Promise<void>;
  onCancel: () => void;
  onPositionChange?: (lat: number, lng: number) => void;
  isEdit?: boolean;
  hobbyShops?: HobbyShop[];
}

export default function LocationForm({ initialData, onSubmit, onCancel, onPositionChange, isEdit = false, hobbyShops = [] }: LocationFormProps) {
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState<LocationFormData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    latitude: initialData?.latitude || 0,
    longitude: initialData?.longitude || 0,
    classification: initialData?.classification || "bash",
    imageUrl: initialData?.imageUrl || "",
    region: initialData?.region || "",
    associatedHobbyShopId: initialData?.associatedHobbyShopId || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show sign-in prompt if not authenticated
  if (status === "loading") {
    return (
      <div className="p-4 text-center text-gray-500">
        Loading...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Sign in to add spots
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          You need to be signed in to add or edit locations.
        </p>
        <button
          onClick={() => signIn("google")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="text-sm font-medium text-gray-700">Sign in with Google</span>
        </button>
        <button
          onClick={onCancel}
          className="block w-full mt-3 text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (formData.latitude === 0 && formData.longitude === 0) {
      setError("Please tap the map to set a location");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save location");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await response.json();
      setFormData((prev) => ({ ...prev, imageUrl: data.imageUrl }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">
        {isEdit ? "Edit Location" : "Add New Location"}
      </h2>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 bg-white border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          placeholder="Enter spot name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 bg-white border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none"
          placeholder="Describe this spot..."
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Location
          </label>
          {formData.latitude === 0 && formData.longitude === 0 ? (
            <span className="text-xs text-amber-600 font-medium">
              Tap the map to set location
            </span>
          ) : (
            <span className="text-xs text-purple-600">
              Drag the purple pin on the map to adjust
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <input
              type="number"
              step="any"
              value={formData.latitude}
              onChange={(e) => {
                const lat = parseFloat(e.target.value) || 0;
                setFormData((prev) => ({ ...prev, latitude: lat }));
                if (onPositionChange) {
                  onPositionChange(lat, formData.longitude);
                }
              }}
              className="w-full px-3 py-2 bg-white border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Latitude"
            />
          </div>
          <div>
            <input
              type="number"
              step="any"
              value={formData.longitude}
              onChange={(e) => {
                const lng = parseFloat(e.target.value) || 0;
                setFormData((prev) => ({ ...prev, longitude: lng }));
                if (onPositionChange) {
                  onPositionChange(formData.latitude, lng);
                }
              }}
              className="w-full px-3 py-2 bg-white border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Longitude"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Classification *
        </label>
        <div className="flex flex-wrap gap-2">
          {CLASSIFICATIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, classification: c.value }))}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                formData.classification === c.value
                  ? "text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              style={formData.classification === c.value ? { backgroundColor: c.color } : {}}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Region
        </label>
        <select
          value={formData.region}
          onChange={(e) => setFormData((prev) => ({ ...prev, region: e.target.value }))}
          className="w-full px-3 py-2 bg-white border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        >
          <option value="">Select a region</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {formData.classification !== "hobby" && hobbyShops.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nearest Hobby Shop
          </label>
          <select
            value={formData.associatedHobbyShopId || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, associatedHobbyShopId: e.target.value || undefined }))}
            className="w-full px-3 py-2 bg-white border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="">None</option>
            {hobbyShops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Image
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleImageUpload}
          className="hidden"
        />
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {isUploading ? "Uploading..." : "Upload Image"}
          </button>
          {formData.imageUrl && (
            <div className="flex items-center gap-2">
              <img
                src={formData.imageUrl}
                alt="Preview"
                className="w-12 h-12 object-cover rounded"
              />
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, imageUrl: "" }))}
                className="text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : isEdit ? "Update Location" : "Add Location"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
