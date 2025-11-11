'use client'

import React, { useState, useEffect, useRef } from 'react';
import { X, UserPlus } from 'lucide-react';
import { LoadingSpinner } from '../shared';

/**
 * AddUserModal - Professional modal dialog for adding new users
 * Replaces prompt() dialogs with better UX and validation
 * 
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Called when modal is closed
 * @param {function} onSubmit - Called with user name when submitted
 * @param {string} teamColor - Team-specific color (e.g., '#6B8E23', '#9333EA', '#DC2626')
 * @param {string} teamName - Team name for display (e.g., 'Presentation', 'Worship', 'A/V')
 */
const AddUserModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  teamColor = '#6B8E23',
  teamName = 'Team'
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'Enter' && !isSubmitting) {
        handleSubmit(e);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, name, isSubmitting]);

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      setError('Please enter a name');
      inputRef.current?.focus();
      return;
    }

    if (trimmedName.length < 2) {
      setError('Name must be at least 2 characters');
      inputRef.current?.focus();
      return;
    }

    if (trimmedName.length > 50) {
      setError('Name must be less than 50 characters');
      inputRef.current?.focus();
      return;
    }

    // Check for invalid characters
    const invalidChars = /[<>{}[\]\\\/]/;
    if (invalidChars.test(trimmedName)) {
      setError('Name contains invalid characters');
      inputRef.current?.focus();
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await onSubmit(trimmedName);
      // Success - modal will be closed by parent
    } catch (err) {
      setError(err.message || 'Failed to add user');
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-6 border-b border-gray-200"
          style={{ borderBottomColor: `${teamColor}20` }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${teamColor}20` }}
            >
              <UserPlus 
                className="w-5 h-5" 
                style={{ color: teamColor }}
              />
            </div>
            <h2 
              className="text-xl font-bold"
              style={{ color: teamColor }}
            >
              Add {teamName} User
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label 
                htmlFor="userName" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                User Name <span className="text-red-500">*</span>
              </label>
              <input
                ref={inputRef}
                id="userName"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                disabled={isSubmitting}
                placeholder="Enter user name..."
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  error 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-opacity-50'
                }`}
                style={!error ? { 
                  borderColor: name ? teamColor : undefined,
                  focusRing: teamColor 
                } : {}}
                maxLength={50}
              />
              {error && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span className="font-medium">⚠</span>
                  {error}
                </p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                {name.length}/50 characters
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-4 py-2 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
              style={{ 
                backgroundColor: teamColor,
                opacity: isSubmitting || !name.trim() ? 0.5 : 1
              }}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" color="white" />
                  Adding...
                </span>
              ) : (
                'Add User'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
