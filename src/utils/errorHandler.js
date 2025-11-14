/**
 * Centralized Error Handling Utility
 * Provides consistent error messages and handling across the application
 */

/**
 * Standard error messages for common scenarios
 */
export const ERROR_MESSAGES = {
  // Network/API errors
  NETWORK_ERROR:
    "Unable to connect to the server. Please check your internet connection.",
  API_ERROR: "Something went wrong. Please try again.",
  TIMEOUT_ERROR: "The request took too long. Please try again.",

  // User operations
  USER_ADD_ERROR: "Unable to add user. Please try again.",
  USER_DELETE_ERROR: "Unable to remove user. Please try again.",
  USER_UPDATE_ERROR: "Unable to update user. Please try again.",

  // Assignment operations
  ASSIGNMENT_ERROR: "Unable to save assignment. Please try again.",
  ASSIGNMENT_DELETE_ERROR: "Unable to remove assignment. Please try again.",

  // Service operations
  SERVICE_CREATE_ERROR: "Unable to create service. Please try again.",
  SERVICE_UPDATE_ERROR: "Unable to update service details. Please try again.",
  SERVICE_DELETE_ERROR: "Unable to delete service. Please try again.",
  SERVICE_LOAD_ERROR:
    "Unable to load service details. Please refresh the page.",

  // Song operations
  SONG_SELECT_ERROR: "Unable to save song selection. Please try again.",
  SONG_LOAD_ERROR: "Unable to load songs. Please refresh the page.",

  // Completion operations
  COMPLETION_ERROR: "Unable to update completion status. Please try again.",

  // Data loading errors
  DATA_LOAD_ERROR: "Unable to load data. Please refresh the page.",

  // Validation errors
  VALIDATION_ERROR: "Please check your input and try again.",
  EMPTY_FIELD_ERROR: "This field cannot be empty.",
  INVALID_DATE_ERROR: "Please enter a valid date.",

  // Permission errors
  PERMISSION_ERROR: "You do not have permission to perform this action.",

  // Generic fallback
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
};

/**
 * Success messages for operations
 */
export const SUCCESS_MESSAGES = {
  USER_ADDED: "User added successfully!",
  USER_DELETED: "User removed successfully!",
  USER_UPDATED: "User updated successfully!",

  ASSIGNMENT_SAVED: "Assignment saved successfully!",
  ASSIGNMENT_DELETED: "Assignment removed successfully!",

  SERVICE_CREATED: "Service created successfully!",
  SERVICE_UPDATED: "Service updated successfully!",
  SERVICE_DELETED: "Service deleted successfully!",

  SONG_SELECTED: "Song selection saved successfully!",

  COMPLETION_UPDATED: "Completion status updated!",

  CHANGES_SAVED: "Changes saved successfully!",
};

/**
 * Parse error from various sources and return user-friendly message
 * @param {Error|Response|string} error - Error object, response, or message
 * @param {string} fallbackMessage - Message to use if error can't be parsed
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (
  error,
  fallbackMessage = ERROR_MESSAGES.UNKNOWN_ERROR,
) => {
  // If error is already a string, return it
  if (typeof error === "string") {
    return error;
  }

  // Handle Response objects
  if (error instanceof Response) {
    if (!error.ok) {
      switch (error.status) {
        case 400:
          return ERROR_MESSAGES.VALIDATION_ERROR;
        case 401:
        case 403:
          return ERROR_MESSAGES.PERMISSION_ERROR;
        case 404:
          return "The requested resource was not found.";
        case 408:
          return ERROR_MESSAGES.TIMEOUT_ERROR;
        case 500:
        case 502:
        case 503:
          return "Server error. Please try again later.";
        default:
          return fallbackMessage;
      }
    }
  }

  // Handle Error objects
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes("fetch") || error.message.includes("network")) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }

    // Timeout errors
    if (error.message.includes("timeout")) {
      return ERROR_MESSAGES.TIMEOUT_ERROR;
    }

    // Return error message if it seems user-friendly (not too technical)
    if (
      error.message &&
      error.message.length < 100 &&
      !error.message.includes("undefined")
    ) {
      return error.message;
    }
  }

  // Default fallback
  return fallbackMessage;
};

/**
 * Log error for debugging (console in dev, could send to monitoring service in prod)
 * @param {string} context - Where the error occurred (e.g., 'handleAddUser')
 * @param {Error} error - The error object
 * @param {Object} additionalData - Additional context data
 */
export const logError = (context, error, additionalData = {}) => {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    context,
    message: error?.message || String(error),
    stack: error?.stack,
    ...additionalData,
  };

  // In development, log to console
  if (process.env.NODE_ENV === "development") {
    console.error(`[${timestamp}] Error in ${context}:`, errorInfo);
  }

  // In production, you could send to error monitoring service
  // Example: Sentry, LogRocket, etc.
  // if (process.env.NODE_ENV === 'production') {
  //   sendToErrorMonitoring(errorInfo);
  // }

  return errorInfo;
};

/**
 * Create a standardized error handler function
 * @param {string} context - Where the error occurred
 * @param {Function} setAlertMessage - Function to set alert message
 * @param {Function} setShowAlert - Function to show alert
 * @param {string} fallbackMessage - Custom fallback message
 * @returns {Function} Error handler function
 */
export const createErrorHandler = (
  context,
  setAlertMessage,
  setShowAlert,
  fallbackMessage = ERROR_MESSAGES.UNKNOWN_ERROR,
) => {
  return (error, additionalData = {}) => {
    // Log the error
    logError(context, error, additionalData);

    // Get user-friendly message
    const message = getErrorMessage(error, fallbackMessage);

    // Show alert to user
    setAlertMessage(message);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
  };
};

/**
 * Create a standardized success handler function
 * @param {Function} setAlertMessage - Function to set alert message
 * @param {Function} setShowAlert - Function to show alert
 * @param {number} duration - How long to show alert (ms)
 * @returns {Function} Success handler function
 */
export const createSuccessHandler = (
  setAlertMessage,
  setShowAlert,
  duration = 3000,
) => {
  return (message) => {
    setAlertMessage(message);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), duration);
  };
};

/**
 * Retry a failed operation with exponential backoff
 * @param {Function} operation - Async function to retry
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} baseDelay - Base delay in ms (will be multiplied by 2^attempt)
 * @returns {Promise} Result of the operation
 */
export const retryOperation = async (
  operation,
  maxRetries = 3,
  baseDelay = 1000,
) => {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx)
      if (
        error instanceof Response &&
        error.status >= 400 &&
        error.status < 500
      ) {
        throw error;
      }

      // If this wasn't the last attempt, wait before retrying
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  throw lastError;
};

export default {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  getErrorMessage,
  logError,
  createErrorHandler,
  createSuccessHandler,
  retryOperation,
};
