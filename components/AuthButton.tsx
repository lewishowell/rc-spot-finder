"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useState, useRef, useEffect, useCallback } from "react";
import FriendRequestBadge from "./FriendRequestBadge";
import NotificationBell from "./NotificationBell";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

interface AuthButtonProps {
  onOpenFriends?: () => void;
  onOpenProfile?: () => void;
  onOpenGarage?: () => void;
  onOpenNotifications?: () => void;
}

export default function AuthButton({ onOpenFriends, onOpenProfile, onOpenGarage, onOpenNotifications }: AuthButtonProps = {}) {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === "loading") {
    return (
      <div className="w-9 h-9 bg-gray-200 rounded-full animate-pulse" />
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        <NotificationBell onClick={() => onOpenNotifications?.()} />
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-md hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-medium">
                  {session.user.name?.charAt(0) || session.user.email?.charAt(0) || "U"}
                </div>
              )}
            </button>
            <FriendRequestBadge onClick={() => { setIsOpen(false); onOpenFriends?.(); }} />
          </div>

        {isOpen && (
          <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session.user.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {session.user.email}
              </p>
            </div>

            <button
              onClick={() => { setIsOpen(false); onOpenFriends?.(); }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Friends
            </button>

            <button
              onClick={() => { setIsOpen(false); onOpenGarage?.(); }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              My Garage
            </button>

            <button
              onClick={() => { setIsOpen(false); onOpenProfile?.(); }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Profile Settings
            </button>

            <div className="border-t border-gray-100 mt-1 pt-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  signOut();
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("google")}
      className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <GoogleIcon className="w-4 h-4" />
      <span className="text-sm font-medium text-gray-700">Sign in</span>
    </button>
  );
}
