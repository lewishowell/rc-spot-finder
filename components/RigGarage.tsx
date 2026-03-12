"use client";

import { useState, useEffect } from "react";

interface Rig {
  id: string;
  manufacturer: string;
  model: string;
  nickname?: string;
  imageUrl?: string;
  _count?: { modifications: number };
}

interface RigGarageProps {
  userId?: string;
  isOwner?: boolean;
  onRigClick: (rigId: string) => void;
  onAddRig?: () => void;
}

export default function RigGarage({ userId, isOwner = false, onRigClick, onAddRig }: RigGarageProps) {
  const [rigs, setRigs] = useState<Rig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRigs = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = userId ? `/api/users/${userId}/rigs` : "/api/rigs";
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch rigs");
        }
        const data = await response.json();
        setRigs(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load rigs");
      } finally {
        setLoading(false);
      }
    };

    fetchRigs();
  }, [userId]);

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div>
      {isOwner && (
        <button
          onClick={() => onAddRig?.()}
          className="w-full mb-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          Add Rig
        </button>
      )}

      {rigs.length === 0 ? (
        <div className="p-6 text-center">
          <img src="/favicon.svg" alt="" className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm text-gray-400">No rigs yet. Add your first rig!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {rigs.map((rig) => (
            <button
              key={rig.id}
              onClick={() => onRigClick(rig.id)}
              className="text-left rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 hover:bg-gray-50 transition-all cursor-pointer"
            >
              {rig.imageUrl ? (
                <img
                  src={rig.imageUrl}
                  alt={`${rig.manufacturer} ${rig.model}`}
                  className="w-full h-32 object-cover"
                />
              ) : (
                <div className="w-full h-32 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-10 h-10 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              )}
              <div className="p-2">
                <p className="font-medium text-gray-900 text-sm truncate">
                  {rig.manufacturer} {rig.model}
                </p>
                {rig.nickname && (
                  <p className="text-xs text-gray-500 truncate">{rig.nickname}</p>
                )}
                {rig._count && rig._count.modifications > 0 && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                    {rig._count.modifications} mod{rig._count.modifications !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
