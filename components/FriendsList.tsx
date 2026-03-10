"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Friend {
  friendshipId: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    username: string | null;
  };
  since: string;
}

interface FriendRequest {
  friendshipId: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    username: string | null;
  };
  createdAt: string;
}

interface SearchResult {
  id: string;
  name: string;
  username: string;
  image?: string;
}

interface FriendsListProps {
  onClose: () => void;
  onViewProfile: (userId: string) => void;
}

export default function FriendsList({ onClose, onViewProfile }: FriendsListProps) {
  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [acceptingRequest, setAcceptingRequest] = useState<string | null>(null);
  const [decliningRequest, setDecliningRequest] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Fetch friends
  const fetchFriends = useCallback(async () => {
    setLoadingFriends(true);
    try {
      const res = await fetch("/api/friends?status=accepted");
      if (res.ok) {
        const data = await res.json();
        setFriends(data);
      }
    } catch {
      setError("Failed to load friends");
    } finally {
      setLoadingFriends(false);
    }
  }, []);

  // Fetch pending requests
  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const res = await fetch("/api/friends?status=pending&direction=received");
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch {
      setError("Failed to load requests");
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
    fetchRequests();
  }, [fetchFriends, fetchRequests]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch {
        // Silently fail search
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  const handleAddFriend = async (userId: string) => {
    setSendingRequest(userId);
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: userId }),
      });
      if (res.ok) {
        // Remove from search results to indicate success
        setSearchResults((prev) => prev.filter((r) => r.id !== userId));
      } else {
        const data = await res.json();
        setError(data.error || "Failed to send request");
      }
    } catch {
      setError("Failed to send friend request");
    } finally {
      setSendingRequest(null);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    setAcceptingRequest(requestId);
    try {
      const res = await fetch(`/api/friends/request/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.friendshipId !== requestId));
        fetchFriends();
      } else {
        setError("Failed to accept request");
      }
    } catch {
      setError("Failed to accept request");
    } finally {
      setAcceptingRequest(null);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    setDecliningRequest(requestId);
    try {
      const res = await fetch(`/api/friends/request/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.friendshipId !== requestId));
      } else {
        setError("Failed to decline request");
      }
    } catch {
      setError("Failed to decline request");
    } finally {
      setDecliningRequest(null);
    }
  };

  const renderAvatar = (image?: string, name?: string) => {
    if (image) {
      return (
        <img
          src={image}
          alt={name || "User"}
          className="w-9 h-9 rounded-full object-cover"
        />
      );
    }
    return (
      <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm">
        {name?.charAt(0)?.toUpperCase() || "U"}
      </div>
    );
  };

  return (
    <div
      ref={panelRef}
      className="bg-white rounded-lg shadow-lg border border-gray-200 w-80 max-h-[80vh] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Friends</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-gray-100">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search users..."
          className="w-full px-3 py-2 bg-white border-2 border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black opacity-100 text-sm"
        />
        {searchLoading && (
          <p className="text-xs text-gray-400 mt-1">Searching...</p>
        )}
        {searchResults.length > 0 && (
          <div className="mt-2 space-y-2">
            {searchResults.map((user) => (
              <div key={user.id} className="flex items-center gap-2 p-2 rounded-md bg-gray-50">
                {renderAvatar(user.image, user.name)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                </div>
                <button
                  onClick={() => handleAddFriend(user.id)}
                  disabled={sendingRequest === user.id}
                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {sendingRequest === user.id ? "..." : "Add Friend"}
                </button>
              </div>
            ))}
          </div>
        )}
        {searchQuery.trim() && !searchLoading && searchResults.length === 0 && (
          <p className="text-xs text-gray-400 mt-1">No users found</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("friends")}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "friends"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Friends
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === "requests"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Requests
          {requests.length > 0 && (
            <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
              {requests.length}
            </span>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "friends" && (
          <div className="p-2">
            {loadingFriends ? (
              <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>
            ) : friends.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">
                No friends yet. Search for users above to add friends.
              </div>
            ) : (
              <div className="space-y-1">
                {friends.map((friend) => (
                  <div
                    key={friend.friendshipId}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    {renderAvatar(friend.user.image || undefined, friend.user.name || undefined)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{friend.user.name}</p>
                      {friend.user.username && (
                        <p className="text-xs text-gray-500 truncate">@{friend.user.username}</p>
                      )}
                    </div>
                    <button
                      onClick={() => onViewProfile(friend.user.id)}
                      className="px-2 py-1 bg-white border-2 border-gray-500 text-black text-xs font-medium rounded-md hover:bg-gray-50 transition-colors"
                    >
                      View Profile
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "requests" && (
          <div className="p-2">
            {loadingRequests ? (
              <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>
            ) : requests.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">
                No pending friend requests.
              </div>
            ) : (
              <div className="space-y-1">
                {requests.map((request) => (
                  <div
                    key={request.friendshipId}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    {renderAvatar(request.user.image || undefined, request.user.name || undefined)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{request.user.name}</p>
                      {request.user.username && (
                        <p className="text-xs text-gray-500 truncate">@{request.user.username}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleAcceptRequest(request.friendshipId)}
                        disabled={acceptingRequest === request.friendshipId}
                        className="px-2 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {acceptingRequest === request.friendshipId ? "..." : "Accept"}
                      </button>
                      <button
                        onClick={() => handleDeclineRequest(request.friendshipId)}
                        disabled={decliningRequest === request.friendshipId}
                        className="px-2 py-1 border border-red-300 text-red-600 text-xs rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {decliningRequest === request.friendshipId ? "..." : "Decline"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
