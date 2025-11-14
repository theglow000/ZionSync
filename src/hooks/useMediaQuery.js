"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook to detect if a media query matches
 * @param {string} query - The media query to check
 * @returns {boolean} - Whether the media query matches
 */
const useMediaQuery = (query) => {
  // Initialize with null (will be updated in useEffect to prevent hydration mismatch)
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window !== "undefined") {
      const media = window.matchMedia(query);

      // Set initial value
      setMatches(media.matches);

      // Define listener function
      const listener = (event) => {
        setMatches(event.matches);
      };

      // Add listener
      media.addEventListener("change", listener);

      // Clean up
      return () => {
        media.removeEventListener("change", listener);
      };
    }
  }, [query]);

  return matches;
};

export default useMediaQuery;
