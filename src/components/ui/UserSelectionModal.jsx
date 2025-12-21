"use client";

import React from "react";
import { X, Trash2, UserCircle } from "lucide-react";
import useResponsive from "../../hooks/useResponsive";
import { useConfirm } from "../../hooks/useConfirm";

const UserSelectionModal = ({
  showModal,
  onClose,
  availableUsers,
  onSelect,
  onDelete,
  initialUserName,
  title = "Select User",
  showDeleteButton = !!initialUserName,
  currentAssignments = {}, // Add this prop to receive assignments for current date
  currentPosition = null, // Add this prop to know which position we're editing
  isPastDate = false, // Add this prop to know if we're editing a past date
}) => {
  const { isMobile } = useResponsive();
  const { confirm, ConfirmDialog } = useConfirm();

  if (!showModal) return null;

  // Function to check if a user is already assigned to another position
  const isUserAssignedElsewhere = (userName) => {
    // Skip check for the current position's assignee
    if (initialUserName === userName) return false;

    // Check all positions
    return Object.entries(currentAssignments).some(([key, value]) => {
      // Skip the position we're currently editing
      if (key === `team_member_${currentPosition}`) return false;
      // Check if the user is assigned to any other position
      return value === userName;
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4">
      <div
        className={`bg-white rounded-lg w-full ${isMobile ? "max-w-sm max-h-[80vh]" : "max-w-sm max-h-[600px]"} overflow-hidden shadow-xl flex flex-col`}
      >
        <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
          <h3 className="font-medium text-lg text-[#6B8E23]">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          className={`overflow-y-auto p-2 ${isMobile ? "max-h-[60vh]" : "max-h-[450px]"} flex-1`}
        >
          {availableUsers.map((user) => {
            const isAssignedElsewhere = isUserAssignedElsewhere(user.name);
            const isDeleted = user.deleted === true;

            return (
              <button
                key={user.name}
                className={`w-full text-left p-3 rounded-lg flex items-center justify-between my-1
                  ${
                    initialUserName === user.name
                      ? "bg-[#6B8E23] bg-opacity-20 text-[#6B8E23] font-medium"
                      : isAssignedElsewhere
                        ? "text-gray-400 bg-gray-50 cursor-not-allowed"
                        : isDeleted && !isPastDate
                          ? "text-gray-400 bg-gray-50 cursor-not-allowed"
                          : isDeleted && isPastDate
                            ? "text-gray-600 hover:bg-gray-100 border border-gray-300"
                            : "text-black hover:bg-gray-100"
                  }`}
                onClick={() => {
                  // Prevent action if user is already assigned elsewhere
                  if (isAssignedElsewhere) return;
                  // Prevent selecting deleted users for future dates
                  if (isDeleted && !isPastDate) return;

                  onSelect(user.name);
                  onClose();
                }}
                disabled={isAssignedElsewhere || (isDeleted && !isPastDate)}
              >
                <div className="flex items-center">
                  <UserCircle
                    className={`w-5 h-5 mr-2 ${isAssignedElsewhere || (isDeleted && !isPastDate) ? "text-gray-400" : "text-[#6B8E23]"}`}
                  />
                  <span>{user.name}</span>
                </div>

                {/* Show different indicators based on status */}
                {initialUserName === user.name ? (
                  <span className="text-xs text-[#6B8E23]">Current</span>
                ) : isAssignedElsewhere ? (
                  <span className="text-xs text-gray-400">
                    Already Assigned
                  </span>
                ) : isDeleted && isPastDate ? (
                  <span className="text-xs text-orange-600 font-medium">
                    Inactive
                  </span>
                ) : isDeleted ? (
                  <span className="text-xs text-gray-400">Inactive</span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="border-t p-4 bg-gray-50 flex flex-col gap-2 flex-shrink-0">
          {/* Only show delete button if showDeleteButton is true AND we have initialUserName and onDelete */}
          {showDeleteButton && initialUserName && onDelete && (
            <button
              onClick={async () => {
                const confirmed = await confirm({
                  title: "Remove Assignment",
                  message: `Remove assignment for ${initialUserName}?`,
                  variant: "warning",
                  confirmText: "Remove",
                  cancelText: "Cancel",
                });

                if (confirmed) {
                  onDelete();
                  onClose();
                }
              }}
              className="w-full py-2 text-center bg-red-100 text-red-600 rounded-lg hover:bg-red-200 flex items-center justify-center"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove Assignment
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-2 text-center bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog />
    </div>
  );
};

export default UserSelectionModal;
