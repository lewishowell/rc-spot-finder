"use client";

import { useState, useEffect } from "react";

const MOD_CATEGORIES = [
  "Motor", "ESC", "Battery", "Servo", "Chassis",
  "Suspension", "Tires", "Body", "Drivetrain", "Electronics", "Other",
] as const;

interface ModFormData {
  category: string;
  brand: string;
  name: string;
  notes: string;
}

interface ModFormProps {
  rigId: string;
  modId?: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function ModForm({ rigId, modId, onClose, onSaved }: ModFormProps) {
  const [formData, setFormData] = useState<ModFormData>({
    category: "Motor",
    brand: "",
    name: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(!!modId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!modId) return;

    const fetchMod = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/rigs/${rigId}/mods/${modId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch modification");
        }
        const data = await response.json();
        setFormData({
          category: data.category || "Motor",
          brand: data.brand || "",
          name: data.name || "",
          notes: data.notes || "",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load modification");
      } finally {
        setLoading(false);
      }
    };

    fetchMod();
  }, [rigId, modId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.brand.trim()) {
      setError("Brand is required");
      return;
    }

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = modId
        ? `/api/rigs/${rigId}/mods/${modId}`
        : `/api/rigs/${rigId}/mods`;
      const method = modId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const data = await response.json();
          throw new Error(data.error || "Failed to save modification");
        } else {
          throw new Error(`Failed to save modification (${response.status})`);
        }
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save modification");
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
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3 className="text-lg font-bold text-gray-900">
        {modId ? "Edit Modification" : "Add Modification"}
      </h3>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-black mb-1">
          Category *
        </label>
        <select
          value={formData.category}
          onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
          className="w-full px-3 py-2 bg-white border-2 border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black opacity-100"
        >
          {MOD_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-1">
          Brand *
        </label>
        <input
          type="text"
          value={formData.brand}
          onChange={(e) => setFormData((prev) => ({ ...prev, brand: e.target.value }))}
          className="w-full px-3 py-2 bg-white border-2 border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black opacity-100"
          placeholder="e.g. Castle, Spektrum, Proline"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-1">
          Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 bg-white border-2 border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black opacity-100"
          placeholder="e.g. Copperhead 10, Badlands MX38"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-black mb-1">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
          rows={2}
          className="w-full px-3 py-2 bg-white border-2 border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black opacity-100 resize-none"
          placeholder="Optional notes..."
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : modId ? "Update Mod" : "Add Mod"}
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
