import { useState, useCallback } from "react";

/**
 * Custom hook for managing modal open/close state
 * Provides a simple interface for modal state management
 *
 * @param {boolean} initialState - Initial open state (default: false)
 *
 * @returns {Object} Object containing:
 *   - isOpen: Boolean indicating if modal is open
 *   - open: Function to open the modal
 *   - close: Function to close the modal
 *   - toggle: Function to toggle modal state
 *   - setIsOpen: Function to directly set modal state
 *
 * @example
 * const addUserModal = useModal();
 * const editModal = useModal(false);
 *
 * // In JSX:
 * <button onClick={addUserModal.open}>Add User</button>
 *
 * <AddUserModal
 *   isOpen={addUserModal.isOpen}
 *   onClose={addUserModal.close}
 * />
 */
export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen,
  };
};

export default useModal;
