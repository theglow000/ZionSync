import { useEffect, useRef } from "react";
import { X } from "lucide-react";

/**
 * ConfirmDialog Component
 *
 * Accessible confirmation dialog with keyboard support and mobile responsiveness.
 * Replaces native window.confirm() with a professional, customizable dialog.
 *
 * @component
 * @example
 * // Basic usage with useConfirm hook
 * const { confirm, ConfirmDialog } = useConfirm();
 *
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: 'Delete Service',
 *     message: 'Are you sure you want to delete this service?',
 *     variant: 'danger'
 *   });
 *   if (confirmed) {
 *     // Proceed with deletion
 *   }
 * };
 *
 * @example
 * // Standalone usage
 * <ConfirmDialog
 *   isOpen={isOpen}
 *   title="Confirm Action"
 *   message="Are you sure?"
 *   onConfirm={() => handleAction()}
 *   onCancel={() => setIsOpen(false)}
 *   variant="danger"
 * />
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the dialog is visible
 * @param {string} [props.title='Confirm Action'] - Dialog title
 * @param {string} props.message - Confirmation message
 * @param {Array<string>} [props.details] - Optional array of bullet points for better readability
 * @param {Function} props.onConfirm - Callback when user confirms
 * @param {Function} props.onCancel - Callback when user cancels
 * @param {string} [props.confirmText='Confirm'] - Text for confirm button
 * @param {string} [props.cancelText='Cancel'] - Text for cancel button
 * @param {string} [props.variant='default'] - Visual variant: 'default', 'danger', or 'warning'
 * @returns {JSX.Element|null} ConfirmDialog component or null if not open
 */
export const ConfirmDialog = ({
  isOpen,
  title = "Confirm Action",
  message,
  details,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
}) => {
  const dialogRef = useRef(null);
  const confirmButtonRef = useRef(null);

  // Variant styles
  const variantClasses = {
    default: {
      button: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
      icon: "text-blue-600",
    },
    danger: {
      button: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
      icon: "text-red-600",
    },
    warning: {
      button: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
      icon: "text-yellow-600",
    },
  };

  const styles = variantClasses[variant] || variantClasses.default;

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onCancel();
      } else if (e.key === "Enter") {
        onConfirm();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Focus the confirm button when dialog opens
    confirmButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onConfirm, onCancel]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-lg shadow-xl max-w-md w-full animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
          <h2
            id="confirm-dialog-title"
            className="text-lg md:text-xl font-semibold text-gray-900"
          >
            {title}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 md:p-6">
          <p
            id="confirm-dialog-message"
            className="text-sm md:text-base text-gray-700 leading-relaxed"
          >
            {message}
          </p>

          {/* Optional details list */}
          {details && details.length > 0 && (
            <ul className="mt-3 space-y-1.5 text-sm text-gray-600 bg-gray-50 rounded-md p-3 max-h-48 overflow-y-auto">
              {details.map((detail, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-gray-400 mr-2 flex-shrink-0">•</span>
                  <span className="break-words">{detail}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 p-4 md:p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 
              bg-white border border-gray-300 rounded-md hover:bg-gray-50 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
              transition-colors duration-150"
            aria-label={cancelText}
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            className={`w-full sm:w-auto px-4 py-2 text-sm font-medium text-white 
              ${styles.button} rounded-md focus:outline-none focus:ring-2 
              focus:ring-offset-2 transition-colors duration-150`}
            aria-label={confirmText}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
