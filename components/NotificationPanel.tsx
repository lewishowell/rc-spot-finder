"use client";

import { useState, useEffect, useRef } from "react";

interface NotificationActor {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
}

interface Notification {
  id: string;
  type: string;
  message: string;
  linkId: string | null;
  read: boolean;
  createdAt: string;
  actor: NotificationActor | null;
}

interface NotificationPanelProps {
  onClose: () => void;
  onViewSpot?: (spotId: string) => void;
  onViewRig?: (rigId: string) => void;
  onViewProfile?: (userId: string) => void;
}

export default function NotificationPanel({
  onClose,
  onViewSpot,
  onViewRig,
  onViewProfile,
}: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Fetch notifications
  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications?limit=30");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, []);

  // Mark all as read when panel opens
  useEffect(() => {
    fetch("/api/notifications/read-all", { method: "POST" }).catch(() => {});
  }, []);

  const handleNotificationClick = (notif: Notification) => {
    if (notif.type === "friend_new_spot" && notif.linkId && onViewSpot) {
      onViewSpot(notif.linkId);
    } else if (notif.type === "friend_new_rig" && notif.linkId && onViewRig) {
      onViewRig(notif.linkId);
    } else if (notif.actor && onViewProfile) {
      onViewProfile(notif.actor.id);
    }
  };

  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "friend_new_spot":
        return (
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        );
      case "friend_new_rig":
        return (
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div
      ref={panelRef}
      className="bg-white rounded-lg shadow-lg border border-gray-200 w-80 max-h-[80vh] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Notifications list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-sm text-gray-400">No notifications yet</p>
            <p className="text-xs text-gray-400 mt-1">
              You&apos;ll see updates when friends add spots or rigs
            </p>
          </div>
        ) : (
          <div>
            {notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                  !notif.read ? "bg-blue-50/50" : ""
                }`}
              >
                {getIcon(notif.type)}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm text-gray-900 ${!notif.read ? "font-medium" : ""}`}>
                    {notif.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{timeAgo(notif.createdAt)}</p>
                </div>
                {!notif.read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
