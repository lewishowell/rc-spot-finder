"use client";

import { useState, useEffect, useCallback } from "react";
import { CLASSIFICATIONS, REGIONS } from "@/lib/types";

interface WelcomeOverlayProps {
  onDismiss: () => void;
  onRegionSelect: (region: string) => void;
}

export default function WelcomeOverlay({
  onDismiss,
  onRegionSelect,
}: WelcomeOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const hasVisited = localStorage.getItem("hasVisited");
    if (hasVisited) {
      onDismiss();
      return;
    }
    // Trigger fade-in on next frame
    requestAnimationFrame(() => setVisible(true));
  }, [onDismiss]);

  const dismiss = useCallback(() => {
    setFadeOut(true);
    localStorage.setItem("hasVisited", "true");
    setTimeout(() => {
      onDismiss();
    }, 400);
  }, [onDismiss]);

  const handleRegionSelect = useCallback(
    (region: string) => {
      localStorage.setItem("hasVisited", "true");
      setFadeOut(true);
      setTimeout(() => {
        onRegionSelect(region);
      }, 400);
    },
    [onRegionSelect]
  );

  // Filter out "Other" from the region picker for a cleaner welcome experience
  const displayRegions = REGIONS.filter((r) => r !== "Other");

  return (
    <div
      className={`fixed inset-0 z-[2000] flex items-center justify-center transition-opacity duration-400 ${
        visible && !fadeOut ? "opacity-100" : "opacity-0"
      }`}
      style={{ pointerEvents: visible ? "auto" : "none" }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto rounded-2xl bg-gray-900/95 border border-gray-700/50 shadow-2xl">
        <div className="px-8 py-10 sm:px-12 sm:py-12">
          {/* Hero */}
          <div className="text-center mb-10">
            <img src="/logo-mobile.svg" alt="RC Spot Finder" className="h-16 sm:h-20 mx-auto mb-4 drop-shadow-lg" />
            <p className="text-lg sm:text-xl text-gray-300 font-light">
              Discover and share the best RC spots near you
            </p>
          </div>

          {/* Classification types */}
          <div className="mb-10">
            <div className="flex flex-wrap justify-center gap-3">
              {CLASSIFICATIONS.map((c) => (
                <span
                  key={c.value}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800/80 border border-gray-700/50"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="text-sm text-gray-200 font-medium">
                    {c.label}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Region picker */}
          <div className="mb-10">
            <h2 className="text-center text-lg font-semibold text-gray-200 mb-4">
              Where do you ride?
            </h2>
            <div className="flex flex-wrap justify-center gap-2">
              {displayRegions.map((region) => (
                <button
                  key={region}
                  onClick={() => handleRegionSelect(region)}
                  className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-600/50 text-sm font-medium text-gray-200 hover:bg-blue-600 hover:border-blue-500 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          {/* Dismiss button */}
          <div className="text-center">
            <button
              onClick={dismiss}
              className="px-8 py-3 rounded-xl bg-blue-600 text-white font-semibold text-base hover:bg-blue-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 shadow-lg shadow-blue-600/20"
            >
              Explore the Map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
