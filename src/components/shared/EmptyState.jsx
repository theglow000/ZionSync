import React from 'react';

/**
 * EmptyState Component
 * 
 * A reusable component for displaying empty state messages consistently across the app.
 * Shows an icon, title, descriptive message, and optional action button.
 * 
 * @param {Object} props - Component props
 * @param {React.ComponentType} props.icon - Lucide icon component to display
 * @param {string} props.title - Main heading text
 * @param {string} props.message - Descriptive message text
 * @param {Function} [props.action] - Optional callback for action button
 * @param {string} [props.actionText] - Text for action button (required if action provided)
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.iconColor] - Icon color (default: 'text-gray-400')
 * @param {string} [props.size] - Size variant: 'sm', 'md', 'lg' (default: 'md')
 * 
 * @example
 * <EmptyState
 *   icon={Search}
 *   title="No Results Found"
 *   message="Try adjusting your search criteria or filters"
 *   action={() => handleReset()}
 *   actionText="Clear Filters"
 * />
 */
const EmptyState = ({
  icon: Icon,
  title,
  message,
  action,
  actionText,
  className = '',
  iconColor = 'text-gray-400',
  size = 'md'
}) => {
  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'py-6',
      icon: 'w-10 h-10',
      title: 'text-base',
      message: 'text-xs',
      button: 'px-3 py-1.5 text-xs'
    },
    md: {
      container: 'py-8',
      icon: 'w-12 h-12',
      title: 'text-lg',
      message: 'text-sm',
      button: 'px-4 py-2 text-sm'
    },
    lg: {
      container: 'py-12',
      icon: 'w-16 h-16',
      title: 'text-xl',
      message: 'text-base',
      button: 'px-5 py-2.5 text-base'
    }
  };

  const config = sizeConfig[size] || sizeConfig.md;

  return (
    <div className={`text-center ${config.container} ${className}`}>
      {/* Icon */}
      {Icon && (
        <div className="flex justify-center mb-3">
          <Icon className={`${config.icon} ${iconColor}`} />
        </div>
      )}

      {/* Title */}
      <h3 className={`font-semibold text-gray-700 mb-2 ${config.title}`}>
        {title}
      </h3>

      {/* Message */}
      <p className={`text-gray-500 mb-4 max-w-md mx-auto ${config.message}`}>
        {message}
      </p>

      {/* Optional Action Button */}
      {action && actionText && (
        <button
          onClick={action}
          className={`${config.button} bg-purple-600 text-white rounded-lg hover:bg-purple-700 
            transition-colors font-medium shadow-sm hover:shadow-md`}
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export { EmptyState };
export default EmptyState;
