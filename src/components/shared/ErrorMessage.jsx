import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * ErrorMessage Component
 * 
 * Reusable error message display with optional retry functionality.
 * Provides consistent error UI across the application.
 * 
 * @component
 * @example
 * // Basic usage
 * <ErrorMessage message="Failed to load data" />
 * 
 * @example
 * // With retry button
 * <ErrorMessage 
 *   message="Failed to load services" 
 *   onRetry={() => fetchServices()}
 *   retryText="Try Again"
 * />
 * 
 * @param {Object} props - Component props
 * @param {string} props.message - Error message to display
 * @param {Function} [props.onRetry] - Optional callback function when retry button is clicked
 * @param {string} [props.retryText='Retry'] - Text for the retry button
 * @param {string} [props.className=''] - Additional CSS classes for the container
 * @param {string} [props.variant='danger'] - Visual variant: 'danger' (red) or 'warning' (yellow)
 * @returns {JSX.Element} ErrorMessage component
 */
export const ErrorMessage = ({ 
  message, 
  onRetry,
  retryText = 'Retry',
  className = '',
  variant = 'danger'
}) => {
  const variantClasses = {
    danger: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: 'text-yellow-600',
      button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
    }
  };

  const styles = variantClasses[variant] || variantClasses.danger;

  return (
    <div 
      className={`${styles.bg} ${styles.border} border rounded-lg p-4 md:p-6 ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className={`${styles.icon} flex-shrink-0 mt-0.5`} size={20} />
        <div className="flex-1">
          <p className={`${styles.text} text-sm md:text-base font-medium`}>
            {message}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className={`mt-3 inline-flex items-center gap-2 px-4 py-2 
                ${styles.button} text-white text-sm font-medium rounded-md
                transition-colors duration-150 focus:outline-none focus:ring-2 
                focus:ring-offset-2`}
              aria-label={retryText}
            >
              <RefreshCw size={16} />
              {retryText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
