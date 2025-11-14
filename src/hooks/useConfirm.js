import React, { useState, useCallback } from "react";
import { ConfirmDialog as SharedConfirmDialog } from "../components/shared/ConfirmDialog";

/**
 * Custom hook for displaying confirmation dialogs
 * Provides a more user-friendly and customizable alternative to window.confirm()
 *
 * @returns {Object} Object containing:
 *   - showConfirm: Boolean indicating if confirm dialog is visible
 *   - confirmConfig: Object containing dialog configuration (message, onConfirm, onCancel, etc.)
 *   - confirm: Function to show a confirmation dialog
 *   - ConfirmDialog: React component to render the dialog
 *
 * @example
 * const { confirm, ConfirmDialog } = useConfirm();
 *
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: 'Delete User',
 *     message: 'Are you sure you want to remove this user?',
 *     confirmText: 'Delete',
 *     cancelText: 'Cancel',
 *     variant: 'danger'
 *   });
 *
 *   if (confirmed) {
 *     // Proceed with deletion
 *   }
 * };
 *
 * // In JSX:
 * <ConfirmDialog />
 */
export const useConfirm = () => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: "Confirm",
    message: "",
    details: null,
    confirmText: "Confirm",
    cancelText: "Cancel",
    variant: "default", // 'default', 'danger', 'warning'
    onConfirm: null,
    onCancel: null,
  });

  const confirm = useCallback((config) => {
    return new Promise((resolve) => {
      setConfirmConfig({
        title: config.title || "Confirm",
        message: config.message || "",
        details: config.details || null,
        confirmText: config.confirmText || "Confirm",
        cancelText: config.cancelText || "Cancel",
        variant: config.variant || "default",
        onConfirm: () => {
          setShowConfirm(false);
          resolve(true);
          if (config.onConfirm) config.onConfirm();
        },
        onCancel: () => {
          setShowConfirm(false);
          resolve(false);
          if (config.onCancel) config.onCancel();
        },
      });
      setShowConfirm(true);
    });
  }, []);

  // ConfirmDialog component - uses the shared component
  const ConfirmDialog = useCallback(() => {
    return (
      <SharedConfirmDialog
        isOpen={showConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        details={confirmConfig.details}
        onConfirm={confirmConfig.onConfirm}
        onCancel={confirmConfig.onCancel}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        variant={confirmConfig.variant}
      />
    );
  }, [showConfirm, confirmConfig]);

  return {
    showConfirm,
    confirmConfig,
    confirm,
    ConfirmDialog,
  };
};

export default useConfirm;
