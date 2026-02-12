"use client";

import { useState, useRef } from "react";
import { LocationFormData, CLASSIFICATIONS, REGIONS } from "@/lib/types";
import RatingStars from "./RatingStars";

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
  const [formData, setFormData] = useState<LocationFormData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    latitude: initialData?.latitude || 0,
    longitude: initialData?.longitude || 0,
    classification: initialData?.classification || "bash",
    rating: initialData?.rating || 3,
    imageUrl: initialData?.imageUrl || "",
    region: initialData?.region || "",
    associatedHobbyShopId: initialData?.associatedHobbyShopId || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Name is required");
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Describe this spot..."
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Location
          </label>
          <span className="text-xs text-purple-600">
            Drag the purple pin on the map to adjust
          </span>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          Rating
        </label>
        <RatingStars
          rating={formData.rating}
          size="lg"
          readonly={false}
          onChange={(rating) => setFormData((prev) => ({ ...prev, rating }))}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Region
        </label>
        <select
          value={formData.region}
          onChange={(e) => setFormData((prev) => ({ ...prev, region: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
