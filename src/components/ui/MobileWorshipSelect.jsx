import React from "react";
import { X, UserCircle } from "lucide-react";

const MobileWorshipSelect = ({
  showSelector,
  setShowSelector,
  availableUsers,
  currentUser,
  setCurrentUser,
}) => {
  // Filter users similar to the desktop view
  const filteredUsers = availableUsers.filter(
    (user) =>
      // Only show individual users and worship leader
      (user.role === "leader" || (!user.name.includes("&") && !user.role)) &&
      // Exclude special groups
      user.role !== "special" &&
      user.role !== "pastor" &&
      // Exclude specific groups by name
      !user.name.includes("Confirmation") &&
      !user.name.includes("Sunday School"),
  );

  return (
    showSelector && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-sm mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-purple-700">Select User</h2>
            <button
              onClick={() => setShowSelector(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filteredUsers.map((user) => (
              <button
                key={user.name}
                onClick={() => {
                  setCurrentUser({
                    name: user.name,
                    role: user.role,
                    color: "bg-purple-700 bg-opacity-20",
                  });
                  setShowSelector(false);
                }}
                className={`w-full p-3 text-left rounded-lg transition-colors ${
                  currentUser?.name === user.name
                    ? "bg-purple-700 text-white"
                    : "bg-white text-gray-900 border border-gray-200 hover:bg-purple-50"
                }`}
              >
                <div className="flex items-center">
                  <UserCircle className="w-5 h-5 mr-2" />
                  <span>{user.name}</span>
                  {user.role === "leader" && (
                    <span className="text-xs ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                      Leader
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
          {currentUser && (
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => {
                  setCurrentUser(null);
                  setShowSelector(false);
                }}
                className="w-full p-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>
      </div>
    )
  );
};

export default MobileWorshipSelect;
