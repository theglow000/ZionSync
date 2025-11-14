import { useState, useCallback, useRef } from "react";
import { getErrorMessage } from "../utils/errorHandler";
import { fetchWithTimeout } from "../lib/api-utils";

/**
 * Custom hook for fetching data with loading and error state management
 * Provides consistent fetch behavior with automatic loading states and error handling
 * Includes retry logic with exponential backoff
 *
 * @returns {Object} Fetch state and functions
 * @property {boolean} isLoading - Whether a fetch is currently in progress
 * @property {string|null} error - Current error message, null if no error
 * @property {Function} fetchData - Function to execute fetch with automatic state management
 * @property {Function} clearError - Clear the current error state
 * @property {Function} retryLastFetch - Retry the last failed fetch
 */
export const useFetchWithLoading = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastFetchRef = useRef(null);
  const abortControllerRef = useRef(null);

  /**
   * Fetch data with automatic loading and error state management
   * @param {string} url - URL to fetch from
   * @param {Object} options - Fetch options (headers, method, body, etc.)
   * @param {Object} config - Additional configuration
   * @param {boolean} config.parseJson - Whether to parse response as JSON (default: true)
   * @param {number} config.retries - Number of retry attempts (default: 0)
   * @param {number} config.retryDelay - Base delay for retries in ms (default: 1000)
   * @returns {Promise<Object>} { data, error, response }
   */
  const fetchData = useCallback(async (url, options = {}, config = {}) => {
    const { parseJson = true, retries = 0, retryDelay = 1000 } = config;

    // Store fetch params for potential retry
    lastFetchRef.current = { url, options, config };

    // Cancel any in-progress fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    setError(null);

    let lastError = null;
    let attempt = 0;

    while (attempt <= retries) {
      try {
        const response = await fetchWithTimeout(url, {
          ...options,
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = parseJson ? await response.json() : await response.text();

        setIsLoading(false);
        abortControllerRef.current = null;

        return {
          data,
          error: null,
          response,
          success: true,
        };
      } catch (err) {
        // Don't retry if aborted
        if (err.name === "AbortError") {
          setIsLoading(false);
          setError("Request cancelled");
          return {
            data: null,
            error: "Request cancelled",
            response: null,
            success: false,
          };
        }

        lastError = err;

        // If we have retries left, wait and try again
        if (attempt < retries) {
          const delay = retryDelay * Math.pow(2, attempt); // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, delay));
          attempt++;
        } else {
          break;
        }
      }
    }

    // All retries exhausted
    const errorMessage = getErrorMessage(lastError);
    setError(errorMessage);
    setIsLoading(false);
    abortControllerRef.current = null;

    return {
      data: null,
      error: errorMessage,
      response: null,
      success: false,
    };
  }, []);

  /**
   * Clear the current error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Retry the last fetch that was attempted
   * @returns {Promise<Object>} Result of retry attempt
   */
  const retryLastFetch = useCallback(async () => {
    if (!lastFetchRef.current) {
      return {
        data: null,
        error: "No previous fetch to retry",
        response: null,
        success: false,
      };
    }

    const { url, options, config } = lastFetchRef.current;
    return fetchData(url, options, config);
  }, [fetchData]);

  /**
   * Cancel any in-progress fetch
   */
  const cancelFetch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    isLoading,
    error,
    fetchData,
    clearError,
    retryLastFetch,
    cancelFetch,
  };
};

export default useFetchWithLoading;
