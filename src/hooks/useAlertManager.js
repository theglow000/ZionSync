import { useState, useCallback, useRef, useEffect } from 'react';
import { ALERT_DURATION } from '../lib/constants';

/**
 * Custom hook for managing alert/notification state across components
 * Provides consistent alert behavior with auto-dismiss and position management
 * 
 * @returns {Object} Alert state and management functions
 * @property {boolean} showAlert - Whether alert is currently visible
 * @property {string} alertMessage - Current alert message text
 * @property {Object} alertPosition - Alert position coordinates {x, y}
 * @property {Function} setAlertPosition - Manually set alert position
 * @property {Function} showAlertWithTimeout - Display alert with auto-dismiss
 * @property {Function} hideAlert - Manually hide alert
 * @property {Function} clearAlert - Clear alert state completely
 */
export const useAlertManager = () => {
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertPosition, setAlertPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  /**
   * Show alert with automatic dismissal after specified duration
   * @param {string} message - Alert message to display
   * @param {number} duration - Duration in ms (default from ALERT_DURATION constant)
   * @param {Object} position - Optional position {x, y} for alert
   */
  const showAlertWithTimeout = useCallback((message, duration = ALERT_DURATION, position = null) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setAlertMessage(message);
    if (position) {
      setAlertPosition(position);
    }
    setShowAlert(true);

    // Auto-dismiss after duration
    timeoutRef.current = setTimeout(() => {
      setShowAlert(false);
      timeoutRef.current = null;
    }, duration);
  }, []);

  /**
   * Manually hide the alert (keeps message for potential re-show)
   */
  const hideAlert = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setShowAlert(false);
  }, []);

  /**
   * Clear alert completely (hide and clear message)
   */
  const clearAlert = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setShowAlert(false);
    setAlertMessage('');
  }, []);

  return {
    showAlert,
    alertMessage,
    alertPosition,
    setAlertPosition,
    showAlertWithTimeout,
    hideAlert,
    clearAlert,
  };
};

export default useAlertManager;
