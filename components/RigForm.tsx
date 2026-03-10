"use client";

import { useState, useEffect, useRef } from "react";
import imageCompression from "browser-image-compression";

interface RigFormData {
  manufacturer: string;
  model: string;
  nickname: string;
  notes: string;
  imageUrl: string;
}

interface RigFormProps {
  rigId?: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function RigForm({ rigId, onClose, onSaved }: RigFormProps) {
  const [formData, setFormData] = useState<RigFormData>({
    manufacturer: "",
    model: "",
    nickname: "",
    notes: "",
    imageUrl: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(!!rigId);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!rigId) return;

    const fetchRig = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/rigs/${rigId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch rig");
        }
        const data = await response.json();
        setFormData({
          manufacturer: data.manufacturer || "",
          model: data.model || "",
          nickname: data.nickname || "",
          notes: data.notes || "",
          imageUrl: data.imageUrl || "",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load rig");
      } finally {
        setLoading(false);
      }
    };

    fetchRig();
  }, [rigId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      // Compress image before upload to stay under Vercel's 4.5MB limit
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });

      const formDataUpload = new FormData();
      formDataUpload.append("file", compressedFile);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const data = await response.json();
          throw new Error(data.error || "Upload failed");
        } else {
          throw new Error(`Upload failed (${response.status})`);
        }
      }

      const data = await response.json();
      setFormData((prev) => ({ ...prev, imageUrl: data.imageUrl }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to upload image";
      setError(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.manufacturer.trim()) {
      setError("Manufacturer is required");
      return;
    }

    if (!formData.model.trim()) {
      setError("Model is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = rigId ? `/api/rigs/${rigId}` : "/api/rigs";
      const method = rigId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const data = await response.json();
          throw new Error(data.error || "Failed to save rig");
        } else {
          throw new Error(`Failed to save rig (${response.status})`);
        }
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save rig");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">
        {rigId ? "Edit Rig" : "Add New Rig"}
      </h2>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-black mb-1">
          Manufacturer *
        </label>
        <input
          type="text"
          value={formData.manufacturer}
          onChange={(e) => setFormData((prev) => ({ ...prev, manufacturer: e.target.value }))}
          className="w-full px-3 py-2 bg-white border-2 border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black opacity-100"
          placeholder="e.g. Traxxas, Arrma, Losi"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-1">
          Model *
        </label>
        <input
          type="text"
          value={formData.model}
          onChange={(e) => setFormData((prev) => ({ ...prev, model: e.target.value }))}
          className="w-full px-3 py-2 bg-white border-2 border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black opacity-100"
          placeholder="e.g. Slash 4x4, Kraton 6S"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-1">
          Nickname
        </label>
        <input
          type="text"
          value={formData.nickname}
          onChange={(e) => setFormData((prev) => ({ ...prev, nickname: e.target.value }))}
          className="w-full px-3 py-2 bg-white border-2 border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black opacity-100"
          placeholder="Optional nickname"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-1">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 bg-white border-2 border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black opacity-100 resize-none"
          placeholder="Any notes about this rig..."
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-1">
          Image
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="px-4 py-2 bg-white border-2 border-gray-500 text-black font-medium rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {isUploading ? "Uploading..." : "Upload Image"}
        </button>
        {formData.imageUrl && (
          <div className="flex items-center gap-2 mt-2">
            <img
              src={formData.imageUrl}
              alt="Preview"
              className="w-12 h-12 object-cover rounded"
            />
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, imageUrl: "" }))}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : rigId ? "Update Rig" : "Add Rig"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-white border-2 border-gray-500 text-black font-medium rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
