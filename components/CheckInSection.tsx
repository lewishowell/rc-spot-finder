"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

interface Rig {
  id: string;
  manufacturer: string;
  model: string;
  nickname: string | null;
  imageUrl: string | null;
}

interface CheckIn {
  id: string;
  note: string | null;
  imageUrl: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  rig: Rig | null;
}

interface CheckInSectionProps {
  locationId: string;
  checkInCount: number;
  onCheckInCountChange?: (count: number) => void;
  onViewProfile?: (userId: string) => void;
  onViewRig?: (rigId: string) => void;
}

export default function CheckInSection({ locationId, checkInCount, onCheckInCountChange, onViewProfile, onViewRig }: CheckInSectionProps) {
  const { data: session } = useSession();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [note, setNote] = useState("");
  const [selectedRigId, setSelectedRigId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [userRigs, setUserRigs] = useState<Rig[]>([]);

  const fetchCheckIns = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/locations/${locationId}/checkins`);
      if (res.ok) {
        const data = await res.json();
        setCheckIns(data);
      }
    } catch (err) {
      console.error("Error fetching check-ins:", err);
    } finally {
      setIsLoading(false);
    }
  }, [locationId]);

  const fetchUserRigs = useCallback(async () => {
    try {
      const res = await fetch("/api/rigs");
      if (res.ok) {
        const data = await res.json();
        setUserRigs(data);
      }
    } catch (err) {
      console.error("Error fetching rigs:", err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchCheckIns();
    }
  }, [isOpen, fetchCheckIns]);

  useEffect(() => {
    if (showForm && session) {
      fetchUserRigs();
    }
  }, [showForm, session, fetchUserRigs]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setImageUrl(data.url);
      }
    } catch (err) {
      console.error("Error uploading image:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/locations/${locationId}/checkins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: note.trim() || null,
          imageUrl: imageUrl || null,
          rigId: selectedRigId || null,
        }),
      });

      if (res.ok) {
        const newCheckIn = await res.json();
        setCheckIns((prev) => [newCheckIn, ...prev]);
        setNote("");
        setImageUrl("");
        setSelectedRigId("");
        setShowForm(false);
        onCheckInCountChange?.(checkIns.length + 1);
      }
    } catch (err) {
      console.error("Error creating check-in:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const rigDisplayName = (rig: Rig) =>
    rig.nickname || `${rig.manufacturer} ${rig.model}`;

  return (
    <div className="border-t border-gray-100 pt-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {checkInCount} check-in{checkInCount !== 1 ? "s" : ""}
        <svg className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-2 space-y-3">
          {session && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full px-3 py-2 border border-dashed border-gray-300 rounded-md text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              + Check in here
            </button>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-2 p-3 bg-gray-50 rounded-md">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="How was the spot? (optional)"
                rows={2}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-black resize-none"
              />

              {userRigs.length > 0 && (
                <select
                  value={selectedRigId}
                  onChange={(e) => setSelectedRigId(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
                >
                  <option value="">No rig selected</option>
                  {userRigs.map((rig) => (
                    <option key={rig.id} value={rig.id}>
                      {rigDisplayName(rig)}
                    </option>
                  ))}
                </select>
              )}

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer hover:text-blue-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {isUploading ? "Uploading..." : imageUrl ? "Photo added" : "Add photo"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                {imageUrl && (
                  <img src={imageUrl} alt="Check-in" className="w-8 h-8 object-cover rounded" />
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? "Posting..." : "Check In"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setNote(""); setImageUrl(""); setSelectedRigId(""); }}
                  className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {isLoading ? (
            <p className="text-xs text-gray-400">Loading check-ins...</p>
          ) : checkIns.length === 0 ? (
            <p className="text-xs text-gray-400">No check-ins yet. Be the first!</p>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {checkIns.map((checkIn) => (
                <div key={checkIn.id} className="flex gap-2">
                  {checkIn.user.image ? (
                    <img src={checkIn.user.image} alt="" className="w-6 h-6 rounded-full flex-shrink-0 mt-0.5" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <button
                        onClick={() => onViewProfile?.(checkIn.user.id)}
                        className="text-xs font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {checkIn.user.username ? `@${checkIn.user.username}` : checkIn.user.name || "Anonymous"}
                      </button>
                      <span className="text-[10px] text-gray-400">{timeAgo(checkIn.createdAt)}</span>
                    </div>
                    {checkIn.note && (
                      <p className="text-sm text-gray-700">{checkIn.note}</p>
                    )}
                    {checkIn.rig && (
                      <button
                        onClick={() => onViewRig?.(checkIn.rig!.id)}
                        className="mt-1 flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 hover:bg-gray-200 transition-colors"
                      >
                        {checkIn.rig.imageUrl ? (
                          <img src={checkIn.rig.imageUrl} alt="" className="w-5 h-5 rounded object-cover" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        )}
                        {rigDisplayName(checkIn.rig)}
                      </button>
                    )}
                    {checkIn.imageUrl && (
                      <img src={checkIn.imageUrl} alt="Check-in" className="mt-1 w-full max-w-[200px] h-auto rounded-md" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
