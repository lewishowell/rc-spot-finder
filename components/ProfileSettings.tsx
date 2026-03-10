"use client";

import { useState, useEffect } from "react";

interface ProfileData {
  name: string;
  username: string;
  bio: string;
  instagram: string;
  image: string;
  profileVisibility: string;
  createdAt: string;
  spotsCount: number;
}

interface ProfileSettingsProps {
  onClose: () => void;
}

export default function ProfileSettings({ onClose }: ProfileSettingsProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [instagram, setInstagram] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  // Fetch current profile on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setUsername(data.username || "");
          setBio(data.bio || "");
          setInstagram(data.instagram || "");
          setVisibility(data.profileVisibility || "public");
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
  }, []);

  const validateUsername = (value: string): boolean => {
    if (value.length < 3 || value.length > 20) {
      setUsernameError("Username must be 3-20 characters");
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setUsernameError("Only letters, numbers, and underscores allowed");
      return false;
    }
    setUsernameError(null);
    return true;
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (value.trim()) {
      validateUsername(value);
    } else {
      setUsernameError(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateUsername(username)) return;

    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, bio, instagram, profileVisibility: visibility }),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile((prev) => prev ? { ...prev, ...data } : prev);
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setMode("view");
        }, 1500);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save profile");
      }
    } catch {
      setError("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setFadeOut(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleStartEdit = () => {
    setError(null);
    setSuccess(false);
    setMode("edit");
  };

  const handleCancelEdit = () => {
    // Reset form to current profile values
    if (profile) {
      setUsername(profile.username || "");
      setBio(profile.bio || "");
      setInstagram(profile.instagram || "");
      setVisibility(profile.profileVisibility || "public");
    }
    setUsernameError(null);
    setError(null);
    setMode("view");
  };

  const visibilityLabel = (v: string) => {
    switch (v) {
      case "public": return "Public";
      case "friends": return "Friends Only";
      case "private": return "Private";
      default: return v;
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[2000] flex items-center justify-center transition-opacity duration-300 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === "view" ? "My Profile" : "Edit Profile"}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading profile...</div>
          ) : mode === "view" ? (
            /* ===== VIEW MODE ===== */
            <div>
              {/* Avatar + Name */}
              <div className="flex items-start gap-4">
                {profile?.image ? (
                  <img
                    src={profile.image}
                    alt={profile.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-2xl">
                    {profile?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 truncate">{profile?.name}</h3>
                  {profile?.username && (
                    <p className="text-sm text-gray-500">@{profile.username}</p>
                  )}
                  {profile?.createdAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      Member since {new Date(profile.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Bio */}
              {profile?.bio ? (
                <p className="text-sm text-gray-600 mt-4">{profile.bio}</p>
              ) : (
                <p className="text-sm text-gray-400 italic mt-4">No bio yet</p>
              )}

              {/* Instagram */}
              {profile?.instagram && (
                <a
                  href={`https://www.instagram.com/${profile.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-sm text-pink-600 hover:text-pink-700 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                  @{profile.instagram}
                </a>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{profile?.spotsCount ?? 0}</p>
                  <p className="text-xs text-gray-500">Spots</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {visibilityLabel(profile?.profileVisibility || "public")}
                    </span>
                  </p>
                </div>
              </div>

              {/* Edit button */}
              <button
                onClick={handleStartEdit}
                className="w-full mt-5 px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Edit Profile
              </button>
            </div>
          ) : (
            /* ===== EDIT MODE ===== */
            <>
              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Profile updated!
                </div>
              )}
              <form onSubmit={handleSave} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-black mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border-2 border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black opacity-100"
                    placeholder="your_username"
                  />
                  {usernameError && (
                    <p className="text-xs text-red-500 mt-1">{usernameError}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    3-20 characters, letters, numbers, and underscores only
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-1">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-white border-2 border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black opacity-100 resize-none"
                    placeholder="Tell others about yourself..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-1">
                    Instagram
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value.replace(/^@/, ""))}
                      className="w-full pl-7 pr-3 py-2 bg-white border-2 border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black opacity-100"
                      placeholder="your_instagram"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Your Instagram handle (optional)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-1">
                    Profile Visibility
                  </label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="w-full px-3 py-2 bg-white border-2 border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black opacity-100"
                  >
                    <option value="public">Public - Anyone can see your profile</option>
                    <option value="friends">Friends Only - Only friends can see details</option>
                    <option value="private">Private - Hide your profile</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={saving || !!usernameError}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-white border-2 border-gray-500 text-black font-medium rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
