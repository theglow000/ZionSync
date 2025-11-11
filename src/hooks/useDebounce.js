import { useCallback, useRef } from 'react';

/**
 * Custom hook that returns a debounced version of a function
 * @param {Function} callback - The function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);

  const debouncedCallback = useCallback(
    (...args) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  // Cleanup function to clear timeout on unmount
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return [debouncedCallback, cancel];
};

/**
 * Custom hook that returns a throttled version of a function
 * Throttling ensures the function is called at most once per specified time period
 * @param {Function} callback - The function to throttle
 * @param {number} delay - Minimum time between calls in milliseconds
 * @returns {Function} Throttled function
 */
export const useThrottle = (callback, delay) => {
  const lastCallRef = useRef(0);
  const timeoutRef = useRef(null);

  const throttledCallback = useCallback(
    (...args) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallRef.current;

      if (timeSinceLastCall >= delay) {
        // Enough time has passed, call immediately
        lastCallRef.current = now;
        callback(...args);
      } else {
        // Not enough time has passed, schedule for later
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          callback(...args);
        }, delay - timeSinceLastCall);
      }
    },
    [callback, delay]
  );

  return throttledCallback;
};

export default useDebounce;
