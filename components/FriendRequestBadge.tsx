"use client";

import { useState, useEffect, useCallback } from "react";

interface FriendRequestBadgeProps {
  onClick: () => void;
}

export default function FriendRequestBadge({ onClick }: FriendRequestBadgeProps) {
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch("/api/friends/pending-count");
      if (res.ok) {
        const data = await res.json();
        setCount(data.count || 0);
      }
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  if (count <= 0) return null;

  return (
    <button
      onClick={onClick}
      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white shadow-sm hover:bg-red-600 transition-colors"
      title={`${count} pending friend request${count !== 1 ? "s" : ""}`}
    >
      {count}
    </button>
  );
}
