"use client";

import { useState, useEffect, useRef } from "react";

interface UserProfile {
  id: string;
  name: string;
  username: string;
  image?: string;
  bio?: string;
  createdAt: string;
  friendStatus?: "none" | "pending_sent" | "pending_received" | "friends";
  friendRequestId?: string;
  spotsCount?: number;
}

interface Rig {
  id: string;
  manufacturer: string;
  model: string;
  imageUrl?: string;
  modCount: number;
}

interface UserProfilePanelProps {
  userId: string;
  onClose: () => void;
  onViewRig: (rigId: string) => void;
}

export default function UserProfilePanel({ userId, onClose, onViewRig }: UserProfilePanelProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [rigs, setRigs] = useState<Rig[]>([]);
  const [loading, setLoading] = useState(true);
  const [rigsLoading, setRigsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Fetch profile
  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/${userId}/profile`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        } else {
          setError("Failed to load profile");
        }
      } catch {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [userId]);

  // Fetch rigs
  useEffect(() => {
    async function fetchRigs() {
      setRigsLoading(true);
      try {
        const res = await fetch(`/api/users/${userId}/rigs`);
        if (res.ok) {
          const data = await res.json();
          setRigs(data);
        }
      } catch {
        // Silently fail rigs loading
      } finally {
        setRigsLoading(false);
      }
    }
    fetchRigs();
  }, [userId]);

  const handleFriendAction = async () => {
    if (!profile) return;
    setActionLoading(true);
    setError(null);

    try {
      if (profile.friendStatus === "none") {
        const res = await fetch("/api/friends/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ receiverId: userId }),
        });
        if (res.ok) {
          setProfile((prev) => prev ? { ...prev, friendStatus: "pending_sent" } : prev);
        } else {
          const data = await res.json();
          setError(data.error || "Failed to send request");
        }
      } else if (profile.friendStatus === "pending_received" && profile.friendRequestId) {
        const res = await fetch(`/api/friends/request/${profile.friendRequestId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "accept" }),
        });
        if (res.ok) {
          setProfile((prev) => prev ? { ...prev, friendStatus: "friends" } : prev);
        } else {
          setError("Failed to accept request");
        }
      }
    } catch {
      setError("Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const renderFriendButton = () => {
    if (!profile) return null;

    switch (profile.friendStatus) {
      case "friends":
        return (
          <span className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-md">
            Friends
          </span>
        );
      case "pending_sent":
        return (
          <span className="px-4 py-2 bg-gray-100 text-gray-500 text-sm font-medium rounded-md">
            Pending
          </span>
        );
      case "pending_received":
        return (
          <button
            onClick={handleFriendAction}
            disabled={actionLoading}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {actionLoading ? "..." : "Accept"}
          </button>
        );
      default:
        return (
          <button
            onClick={handleFriendAction}
            disabled={actionLoading}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {actionLoading ? "..." : "Add Friend"}
          </button>
        );
    }
  };

  if (loading) {
    return (
      <div
        ref={panelRef}
        className="bg-white rounded-lg shadow-lg border border-gray-200 w-80 p-6"
      >
        <div className="text-center text-gray-500 text-sm">Loading profile...</div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div
        ref={panelRef}
        className="bg-white rounded-lg shadow-lg border border-gray-200 w-80 p-6"
      >
        <div className="text-center">
          <p className="text-red-600 text-sm mb-3">{error}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border-2 border-gray-500 text-black text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className="bg-white rounded-lg shadow-lg border border-gray-200 w-80 max-h-[80vh] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Profile</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Profile info */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start gap-3">
          {profile?.image ? (
            <img
              src={profile.image}
              alt={profile.name}
              className="w-14 h-14 rounded-full object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl">
              {profile?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-900 truncate">{profile?.name}</h3>
            <p className="text-sm text-gray-500 truncate">@{profile?.username}</p>
            {profile?.createdAt && (
              <p className="text-xs text-gray-400 mt-1">
                Member since {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {profile?.bio && (
          <p className="text-sm text-gray-600 mt-3">{profile.bio}</p>
        )}

        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs">
            {error}
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          {renderFriendButton()}
          {profile?.spotsCount !== undefined && (
            <span className="text-sm text-gray-500">
              {profile.spotsCount} spot{profile.spotsCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Rigs section */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3">
          <h4 className="text-sm font-semibold text-black mb-2">Their Rigs</h4>
          {rigsLoading ? (
            <div className="text-center text-gray-400 text-sm py-3">Loading rigs...</div>
          ) : rigs.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-3">No rigs to show</div>
          ) : (
            <div className="space-y-2">
              {rigs.map((rig) => (
                <button
                  key={rig.id}
                  onClick={() => onViewRig(rig.id)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-left"
                >
                  {rig.imageUrl ? (
                    <img
                      src={rig.imageUrl}
                      alt={`${rig.manufacturer} ${rig.model}`}
                      className="w-12 h-12 object-cover rounded flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {rig.manufacturer} {rig.model}
                    </p>
                    <p className="text-xs text-gray-500">
                      {rig.modCount} mod{rig.modCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
