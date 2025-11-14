/**
 * API Utility Functions
 *
 * Provides consistent error handling, timeout protection, and retry logic
 * for all API calls across the application.
 *
 * Sprint 3.5 - API Utilities Implementation
 */

/**
 * Fetch with timeout protection
 *
 * Wraps fetch() with an AbortController to enforce a timeout.
 * If the request takes longer than the specified timeout, it will be aborted.
 *
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options (method, headers, body, etc.)
 * @param {number} timeout - Timeout in milliseconds (default: 10000ms = 10 seconds)
 * @returns {Promise<Response>} The fetch response
 * @throws {Error} If the request times out or fails
 *
 * @example
 * const response = await fetchWithTimeout('/api/users', { method: 'GET' }, 5000);
 * const data = await response.json();
 */
export const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    // Provide a more helpful error message for timeout errors
    if (error.name === "AbortError") {
      throw new Error(`Request timeout: ${url} took longer than ${timeout}ms`);
    }

    throw error;
  }
};

/**
 * Fetch with automatic retry logic
 *
 * Attempts to fetch the URL up to 'retries' times with exponential backoff.
 * Useful for handling transient network failures or temporary server issues.
 *
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options (method, headers, body, etc.)
 * @param {number} retries - Number of retry attempts (default: 3)
 * @param {number} baseDelay - Base delay in milliseconds for exponential backoff (default: 1000ms)
 * @returns {Promise<Response>} The fetch response
 * @throws {Error} If all retry attempts fail
 *
 * @example
 * const response = await fetchWithRetry('/api/data', { method: 'GET' }, 3);
 * const data = await response.json();
 */
export const fetchWithRetry = async (
  url,
  options = {},
  retries = 3,
  baseDelay = 1000,
) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);

      // If response is OK, return it
      if (response.ok) {
        return response;
      }

      // For server errors (5xx), retry. For client errors (4xx), don't retry.
      if (response.status >= 500 && i < retries - 1) {
        // Calculate exponential backoff delay: 1s, 2s, 4s, etc.
        const delay = baseDelay * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Return response even if not OK (let caller handle 4xx errors)
      return response;
    } catch (error) {
      // If this is the last retry, throw the error
      if (i === retries - 1) {
        throw error;
      }

      // Calculate exponential backoff delay: 1s, 2s, 4s, etc.
      const delay = baseDelay * Math.pow(2, i);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

/**
 * Fetch with both timeout and retry protection
 *
 * Combines fetchWithTimeout and fetchWithRetry for maximum reliability.
 * Each retry attempt has its own timeout protection.
 *
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options (method, headers, body, etc.)
 * @param {number} timeout - Timeout per attempt in milliseconds (default: 10000ms)
 * @param {number} retries - Number of retry attempts (default: 3)
 * @returns {Promise<Response>} The fetch response
 * @throws {Error} If all retry attempts fail or timeout
 *
 * @example
 * const response = await fetchWithTimeoutAndRetry('/api/data', { method: 'GET' }, 10000, 3);
 * const data = await response.json();
 */
export const fetchWithTimeoutAndRetry = async (
  url,
  options = {},
  timeout = 10000,
  retries = 3,
) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetchWithTimeout(url, options, timeout);

      // If response is OK, return it
      if (response.ok) {
        return response;
      }

      // For server errors (5xx), retry. For client errors (4xx), don't retry.
      if (response.status >= 500 && i < retries - 1) {
        // Calculate exponential backoff delay: 1s, 2s, 4s, etc.
        const delay = 1000 * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Return response even if not OK (let caller handle 4xx errors)
      return response;
    } catch (error) {
      // If this is the last retry, throw the error
      if (i === retries - 1) {
        throw error;
      }

      // Calculate exponential backoff delay: 1s, 2s, 4s, etc.
      const delay = 1000 * Math.pow(2, i);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

/**
 * Validate and parse JSON response
 *
 * Safely parses JSON response and validates status code.
 * Throws descriptive errors for various failure scenarios.
 *
 * @param {Response} response - The fetch response object
 * @returns {Promise<Object>} Parsed JSON data
 * @throws {Error} If response is not OK or JSON parsing fails
 *
 * @example
 * const response = await fetch('/api/users');
 * const data = await parseJSON(response); // Throws if not OK or invalid JSON
 */
export const parseJSON = async (response) => {
  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  try {
    return await response.json();
  } catch (error) {
    throw new Error("Invalid JSON response from server");
  }
};

/**
 * Validate response status
 *
 * Checks if response has a successful status code (200-299).
 * Throws an error with status code and message if not successful.
 *
 * @param {Response} response - The fetch response object
 * @returns {Response} The same response object if valid
 * @throws {Error} If response status is not OK
 *
 * @example
 * const response = await fetch('/api/users');
 * validateResponse(response); // Throws if status >= 400
 * const data = await response.json();
 */
export const validateResponse = async (response) => {
  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }
  return response;
};

/**
 * Safe JSON parse with fallback
 *
 * Attempts to parse JSON, returns fallback value if parsing fails.
 * Useful for handling potentially malformed responses gracefully.
 *
 * @param {Response} response - The fetch response object
 * @param {*} fallback - Value to return if parsing fails (default: null)
 * @returns {Promise<Object|*>} Parsed JSON data or fallback value
 *
 * @example
 * const response = await fetch('/api/data');
 * const data = await safeParseJSON(response, []); // Returns [] if parsing fails
 */
export const safeParseJSON = async (response, fallback = null) => {
  try {
    return await response.json();
  } catch (error) {
    console.warn("JSON parsing failed, using fallback:", error);
    return fallback;
  }
};

/**
 * Check if response is JSON
 *
 * Validates that the response Content-Type header indicates JSON.
 *
 * @param {Response} response - The fetch response object
 * @returns {boolean} True if Content-Type is application/json
 *
 * @example
 * const response = await fetch('/api/data');
 * if (isJSON(response)) {
 *   const data = await response.json();
 * }
 */
export const isJSON = (response) => {
  const contentType = response.headers.get("content-type");
  return contentType && contentType.includes("application/json");
};

/**
 * Convenience wrapper for GET requests with timeout and retry
 *
 * @param {string} url - The URL to fetch
 * @param {Object} options - Additional fetch options (headers, etc.)
 * @returns {Promise<Object>} Parsed JSON response
 *
 * @example
 * const users = await apiGet('/api/users');
 */
export const apiGet = async (url, options = {}) => {
  const response = await fetchWithTimeoutAndRetry(url, {
    ...options,
    method: "GET",
  });
  return parseJSON(response);
};

/**
 * Convenience wrapper for POST requests with timeout and retry
 *
 * @param {string} url - The URL to fetch
 * @param {Object} data - Data to send in request body
 * @param {Object} options - Additional fetch options (headers, etc.)
 * @returns {Promise<Object>} Parsed JSON response
 *
 * @example
 * const newUser = await apiPost('/api/users', { name: 'John' });
 */
export const apiPost = async (url, data, options = {}) => {
  const response = await fetchWithTimeoutAndRetry(url, {
    ...options,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: JSON.stringify(data),
  });
  return parseJSON(response);
};

/**
 * Convenience wrapper for PUT requests with timeout and retry
 *
 * @param {string} url - The URL to fetch
 * @param {Object} data - Data to send in request body
 * @param {Object} options - Additional fetch options (headers, etc.)
 * @returns {Promise<Object>} Parsed JSON response
 *
 * @example
 * const updated = await apiPut('/api/users/123', { name: 'Jane' });
 */
export const apiPut = async (url, data, options = {}) => {
  const response = await fetchWithTimeoutAndRetry(url, {
    ...options,
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: JSON.stringify(data),
  });
  return parseJSON(response);
};

/**
 * Convenience wrapper for DELETE requests with timeout and retry
 *
 * @param {string} url - The URL to fetch
 * @param {Object} options - Additional fetch options (headers, etc.)
 * @returns {Promise<Object>} Parsed JSON response
 *
 * @example
 * await apiDelete('/api/users/123');
 */
export const apiDelete = async (url, options = {}) => {
  const response = await fetchWithTimeoutAndRetry(url, {
    ...options,
    method: "DELETE",
  });
  return parseJSON(response);
};
