"use client";

import { useState, useEffect } from "react";

const MOD_CATEGORIES = [
  "Motor", "ESC", "Battery", "Servo", "Chassis",
  "Suspension", "Tires", "Body", "Drivetrain", "Electronics", "Other",
] as const;

interface Modification {
  id: string;
  category: string;
  brand: string;
  name: string;
  notes?: string;
}

interface Rig {
  id: string;
  manufacturer: string;
  model: string;
  nickname?: string;
  notes?: string;
  imageUrl?: string;
  isOwner?: boolean;
  modifications: Modification[];
}

interface RigDetailProps {
  rigId: string;
  onClose: () => void;
  onEdit?: () => void;
  onAddMod?: () => void;
  onEditMod?: (modId: string) => void;
}

export default function RigDetail({ rigId, onClose, onEdit, onAddMod, onEditMod }: RigDetailProps) {
  const [rig, setRig] = useState<Rig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const fetchRig = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/rigs/${rigId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch rig");
        }
        const data = await response.json();
        setRig(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load rig");
      } finally {
        setLoading(false);
      }
    };

    fetchRig();
  }, [rigId]);

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    try {
      const response = await fetch(`/api/rigs/${rigId}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Failed to delete rig");
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete rig");
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm mb-3">
          {error}
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-white border-2 border-gray-500 text-black font-medium rounded-md hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
      </div>
    );
  }

  if (!rig) return null;

  // Group modifications by category
  const modsByCategory: Record<string, Modification[]> = {};
  for (const mod of rig.modifications) {
    if (!modsByCategory[mod.category]) {
      modsByCategory[mod.category] = [];
    }
    modsByCategory[mod.category].push(mod);
  }

  // Sort categories in the defined order
  const sortedCategories = MOD_CATEGORIES.filter((cat) => modsByCategory[cat]);

  return (
    <div>
      {/* Image */}
      {rig.imageUrl ? (
        <img
          src={rig.imageUrl}
          alt={`${rig.manufacturer} ${rig.model}`}
          className="w-full h-48 object-cover rounded-lg mb-4"
        />
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mb-4 flex items-center justify-center">
          <svg className="w-16 h-16 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          {rig.manufacturer} {rig.model}
        </h2>
        {rig.nickname && (
          <p className="text-sm text-gray-500">&quot;{rig.nickname}&quot;</p>
        )}
        {rig.notes && (
          <p className="text-gray-600 text-sm mt-2">{rig.notes}</p>
        )}
      </div>

      {/* Modifications */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-black">
            Modifications ({rig.modifications.length})
          </h3>
          {rig.isOwner && onAddMod && (
            <button
              onClick={onAddMod}
              className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              + Add Mod
            </button>
          )}
        </div>

        {sortedCategories.length === 0 ? (
          <p className="text-sm text-gray-500">No modifications listed.</p>
        ) : (
          <div className="space-y-3">
            {sortedCategories.map((category) => (
              <div key={category}>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  {category}
                </h4>
                <div className="space-y-1">
                  {modsByCategory[category].map((mod) => (
                    <div
                      key={mod.id}
                      className={`p-2 rounded-md bg-gray-50 border border-gray-200 ${rig.isOwner && onEditMod ? "cursor-pointer hover:bg-gray-100 transition-colors" : ""}`}
                      onClick={() => rig.isOwner && onEditMod?.(mod.id)}
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {mod.brand} {mod.name}
                      </p>
                      {mod.notes && (
                        <p className="text-xs text-gray-500 mt-0.5">{mod.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-gray-200">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 bg-white border-2 border-gray-500 text-black font-medium rounded-md hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        {rig.isOwner && onEdit && (
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
          >
            Edit
          </button>
        )}
        {rig.isOwner && (
          <button
            onClick={handleDelete}
            className="px-4 py-2 border border-red-300 text-red-600 text-sm rounded-md hover:bg-red-50 transition-colors"
          >
            {confirmDelete ? "Confirm Delete" : "Delete"}
          </button>
        )}
      </div>
    </div>
  );
}
