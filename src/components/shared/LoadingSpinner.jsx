import React from "react";

/**
 * LoadingSpinner Component
 *
 * Reusable loading spinner with customizable message, color, and size.
 * Provides consistent loading UI across the application.
 *
 * @component
 * @example
 * // Basic usage
 * <LoadingSpinner />
 *
 * @example
 * // Custom message and color
 * <LoadingSpinner
 *   message="Loading services..."
 *   color="blue-600"
 *   size="h-16 w-16"
 * />
 *
 * @param {Object} props - Component props
 * @param {string} [props.message='Loading...'] - Loading message to display
 * @param {string} [props.color='gray-700'] - Tailwind color class for the spinner
 * @param {string} [props.size='h-12 w-12'] - Tailwind size classes for the spinner
 * @param {string} [props.className=''] - Additional CSS classes for the container
 * @returns {JSX.Element} LoadingSpinner component
 */
export const LoadingSpinner = ({
  message = "Loading...",
  color = "gray-700",
  size = "h-12 w-12",
  className = "",
}) => (
  <div className={`flex items-center justify-center h-full ${className}`}>
    <div className="text-center p-8">
      <div
        className={`animate-spin rounded-full ${size} border-b-2 border-${color} mx-auto mb-4`}
        role="status"
        aria-label={message}
      />
      <p className="text-gray-600 text-sm md:text-base">{message}</p>
    </div>
  </div>
);

export default LoadingSpinner;
