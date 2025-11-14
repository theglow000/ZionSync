"use client";

import React from "react";
import { X, Trash2, UserCircle, Users } from "lucide-react";
import useResponsive from "../../hooks/useResponsive";
import { useConfirm } from "../../hooks/useConfirm";

const TeamSelectionModal = ({
  showModal,
  onClose,
  date,
  users,
  currentUser,
  assignments,
  serviceDetails,
  onSelect,
  title = "Assign Team",
}) => {
  const { isMobile } = useResponsive();
  const { confirm, ConfirmDialog } = useConfirm();
  const currentAssignment = assignments?.[date]?.team;

  if (!showModal) return null;

  // Group users into categories
  const regularTeams = users.filter((user) => user.name.includes("&"));
  const specialTeams = users.filter(
    (user) =>
      user.role === "special" ||
      user.role === "pastor" ||
      user.role === "leader" ||
      user.name.includes("Confirmation") ||
      user.name.includes("Sunday School"),
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4">
      <div
        className={`bg-white rounded-lg w-full ${isMobile ? "max-w-sm max-h-[80vh]" : "max-w-md max-h-[600px]"} overflow-hidden shadow-xl flex flex-col`}
      >
        <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
          <div>
            <h3 className="font-medium text-lg text-purple-700">{title}</h3>
            <p className="text-sm text-gray-600">
              {serviceDetails?.title
                ? `${serviceDetails.title} - ${date}`
                : date}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          className={`overflow-y-auto p-4 ${isMobile ? "max-h-[60vh]" : "max-h-[calc(600px-150px)]"} flex-1`}
        >
          {/* Regular Teams */}
          <div className="space-y-2 mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Regular Teams
            </h4>
            {regularTeams.length > 0 ? (
              regularTeams.map((team) => (
                <button
                  key={team.name}
                  className={`w-full p-3 text-left rounded-lg transition-colors flex items-center
                    ${
                      currentAssignment === team.name
                        ? "bg-purple-700 text-white"
                        : "bg-white text-gray-900 border border-gray-200 hover:bg-purple-50"
                    }
                  `}
                  onClick={() => {
                    onSelect(team.name);
                    onClose();
                  }}
                >
                  <Users
                    className={`w-5 h-5 mr-2 ${
                      currentAssignment === team.name
                        ? "text-white"
                        : "text-purple-700"
                    }`}
                  />
                  <span>{team.name}</span>
                </button>
              ))
            ) : (
              <p className="text-sm italic text-gray-500">
                No regular teams available
              </p>
            )}
          </div>

          {/* Special Teams */}
          {specialTeams.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Special Teams
              </h4>
              {specialTeams.map((team) => (
                <button
                  key={team.name}
                  className={`w-full p-3 text-left rounded-lg transition-colors flex items-center
                    ${
                      currentAssignment === team.name
                        ? "bg-purple-700 text-white"
                        : "bg-white text-gray-900 border border-gray-200 hover:bg-purple-50"
                    }
                  `}
                  onClick={() => {
                    onSelect(team.name);
                    onClose();
                  }}
                >
                  <UserCircle
                    className={`w-5 h-5 mr-2 ${
                      currentAssignment === team.name
                        ? "text-white"
                        : "text-purple-700"
                    }`}
                  />
                  <span>{team.name}</span>
                  {team.role === "leader" && (
                    <span
                      className={`text-xs ml-2 ${
                        currentAssignment === team.name
                          ? "text-white"
                          : "text-purple-700"
                      }`}
                    >
                      (Leader)
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t p-4 bg-gray-50 flex flex-col gap-2 flex-shrink-0">
          {currentAssignment && (
            <button
              onClick={async () => {
                const confirmed = await confirm({
                  title: "Remove Team Assignment",
                  message: `Remove team assignment for ${date}?`,
                  variant: "warning",
                  confirmText: "Remove",
                  cancelText: "Cancel",
                });

                if (confirmed) {
                  onSelect("");
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

export default TeamSelectionModal;
