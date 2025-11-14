import { useState, useEffect, useCallback } from "react";
import { getErrorMessage } from "../utils/errorHandler";

/**
 * Custom hook for fetching data when component mounts
 * Handles loading states, error handling, and automatic cleanup with AbortController
 *
 * @param {Function} fetchFunction - Async function that performs the fetch. Receives AbortSignal as parameter.
 * @param {Array} dependencies - Array of dependencies that trigger refetch (default: [])
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether to run the fetch (default: true)
 * @param {Function} options.onSuccess - Callback called with data on successful fetch
 * @param {Function} options.onError - Callback called with error on failed fetch
 *
 * @returns {Object} Object containing:
 *   - data: The fetched data
 *   - isLoading: Boolean indicating if fetch is in progress
 *   - error: Error object if fetch failed
 *   - refetch: Function to manually trigger a refetch
 *
 * @example
 * const { data: users, isLoading, error, refetch } = useFetchOnMount(
 *   async (signal) => {
 *     const response = await fetch('/api/users', { signal });
 *     if (!response.ok) throw new Error('Failed to fetch users');
 *     return response.json();
 *   },
 *   [], // dependencies
 *   {
 *     onSuccess: (data) => console.log('Fetched users:', data),
 *     onError: (error) => console.error('Error:', error)
 *   }
 * );
 */
export const useFetchOnMount = (
  fetchFunction,
  dependencies = [],
  options = {},
) => {
  const { enabled = true, onSuccess = null, onError = null } = options;

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState(null);

  const executeFetch = useCallback(
    async (signal) => {
      if (!enabled) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchFunction(signal);

        // Only update state if request wasn't aborted
        if (!signal.aborted) {
          setData(result);
          if (onSuccess) {
            onSuccess(result);
          }
        }
      } catch (err) {
        // Only update state if request wasn't aborted
        if (!signal.aborted) {
          const errorMessage = getErrorMessage(err);
          setError(errorMessage);
          if (onError) {
            onError(err);
          }
          console.error("useFetchOnMount error:", err);
        }
      } finally {
        // Only update state if request wasn't aborted
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [fetchFunction, enabled, onSuccess, onError],
  );

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    executeFetch(controller.signal);

    // Cleanup: abort fetch if component unmounts or dependencies change
    return () => {
      controller.abort();
    };
  }, [enabled, ...dependencies]); // eslint-disable-line react-hooks/exhaustive-deps

  // Manual refetch function
  const refetch = useCallback(() => {
    const controller = new AbortController();
    executeFetch(controller.signal);
  }, [executeFetch]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
};

export default useFetchOnMount;
