"use client";

import { useSession, signIn } from "next-auth/react";
import { useState } from "react";

interface VoteButtonsProps {
  locationId: string;
  upvotes: number;
  downvotes: number;
  userVote: number | null;
  onVoteChange?: (upvotes: number, downvotes: number, userVote: number | null) => void;
  size?: "sm" | "md";
}

export default function VoteButtons({
  locationId,
  upvotes: initialUpvotes,
  downvotes: initialDownvotes,
  userVote: initialUserVote,
  onVoteChange,
  size = "md",
}: VoteButtonsProps) {
  const { data: session } = useSession();
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [isLoading, setIsLoading] = useState(false);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
  };

  const buttonSizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
  };

  const handleVote = async (value: 1 | -1) => {
    if (!session) {
      signIn("google");
      return;
    }

    setIsLoading(true);

    // Determine the new value: toggle off if same vote, otherwise set new vote
    const newValue = userVote === value ? 0 : value;

    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationId, value: newValue }),
      });

      if (!response.ok) {
        throw new Error("Failed to vote");
      }

      const data = await response.json();
      setUpvotes(data.upvotes);
      setDownvotes(data.downvotes);
      setUserVote(data.userVote);

      if (onVoteChange) {
        onVoteChange(data.upvotes, data.downvotes, data.userVote);
      }
    } catch (error) {
      console.error("Error voting:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const score = upvotes - downvotes;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleVote(1)}
        disabled={isLoading}
        className={`flex items-center gap-1 rounded-md border transition-colors ${buttonSizeClasses[size]} ${
          userVote === 1
            ? "bg-green-100 border-green-300 text-green-700"
            : "border-gray-300 text-gray-600 hover:bg-gray-50"
        } disabled:opacity-50`}
        title="Upvote"
      >
        <svg
          className={sizeClasses[size]}
          fill={userVote === 1 ? "currentColor" : "none"}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
          />
        </svg>
        <span>{upvotes}</span>
      </button>

      <span className={`font-medium ${score > 0 ? "text-green-600" : score < 0 ? "text-red-600" : "text-gray-500"} ${size === "sm" ? "text-xs" : "text-sm"}`}>
        {score > 0 ? `+${score}` : score}
      </span>

      <button
        onClick={() => handleVote(-1)}
        disabled={isLoading}
        className={`flex items-center gap-1 rounded-md border transition-colors ${buttonSizeClasses[size]} ${
          userVote === -1
            ? "bg-red-100 border-red-300 text-red-700"
            : "border-gray-300 text-gray-600 hover:bg-gray-50"
        } disabled:opacity-50`}
        title="Downvote"
      >
        <svg
          className={sizeClasses[size]}
          fill={userVote === -1 ? "currentColor" : "none"}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
          />
        </svg>
        <span>{downvotes}</span>
      </button>
    </div>
  );
}
