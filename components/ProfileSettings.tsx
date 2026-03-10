"use client";

import { useState, useEffect } from "react";

interface ProfileSettingsProps {
  onClose: () => void;
}

export default function ProfileSettings({ onClose }: ProfileSettingsProps) {
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
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
          setUsername(data.username || "");
          setBio(data.bio || "");
          setVisibility(data.visibility || "public");
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, bio, visibility }),
      });

      if (res.ok) {
        setSuccess(true);
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
      <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Profile Settings</h2>
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
          ) : success ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Profile Updated</h3>
              <p className="text-sm text-gray-500 mb-4">Your changes have been saved.</p>
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
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
                  onClick={handleClose}
                  className="px-4 py-2 bg-white border-2 border-gray-500 text-black font-medium rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
