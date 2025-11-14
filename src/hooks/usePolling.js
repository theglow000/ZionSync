import { useEffect, useRef, useCallback } from "react";

/**
 * Custom hook for polling/repeatedly executing a function at a specified interval
 * Automatically handles cleanup and supports pause/resume functionality
 *
 * @param {Function} callback - Function to execute on each interval
 * @param {number} interval - Polling interval in milliseconds
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether polling is enabled (default: true)
 * @param {boolean} options.immediate - Whether to execute callback immediately on mount (default: true)
 * @param {Array} options.dependencies - Array of dependencies that trigger polling restart (default: [])
 *
 * @returns {Object} Object containing:
 *   - start: Function to manually start polling
 *   - stop: Function to manually stop polling
 *   - isActive: Boolean indicating if polling is currently active
 *
 * @example
 * const { start, stop, isActive } = usePolling(
 *   async () => {
 *     const response = await fetch('/api/data');
 *     const data = await response.json();
 *     setData(data);
 *   },
 *   30000, // Poll every 30 seconds
 *   {
 *     enabled: true,
 *     immediate: true
 *   }
 * );
 */
export const usePolling = (callback, interval, options = {}) => {
  const { enabled = true, immediate = true, dependencies = [] } = options;

  const intervalRef = useRef(null);
  const callbackRef = useRef(callback);
  const isActiveRef = useRef(false);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Start polling
  const start = useCallback(() => {
    if (isActiveRef.current || !enabled) return;

    // Execute immediately if requested
    if (immediate) {
      callbackRef.current();
    }

    // Set up interval
    intervalRef.current = setInterval(() => {
      callbackRef.current();
    }, interval);

    isActiveRef.current = true;
  }, [interval, immediate, enabled]);

  // Stop polling
  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      isActiveRef.current = false;
    }
  }, []);

  // Set up polling on mount and dependency changes
  useEffect(() => {
    if (enabled) {
      start();
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      stop();
    };
  }, [enabled, start, stop, ...dependencies]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    start,
    stop,
    isActive: isActiveRef.current,
  };
};

export default usePolling;
