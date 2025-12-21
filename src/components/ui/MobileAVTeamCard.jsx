"use client";

import React from "react";
import { Trash2, Edit2 } from "lucide-react";

const MobileAVTeamCard = ({
  item,
  index,
  assignments,
  rotationMembers,
  isPastDate,
  onSignup,
  onRemoveAssignment,
  onEditMember,
  showAlertWithTimeout,
  setAlertPosition,
  serviceTime = null, // Optional service time
  getAssignment, // Function to get assignment by date and serviceTime
}) => {
  const { date, day, title } = item;

  const getRotationMember = (index) => {
    return rotationMembers[index % rotationMembers.length];
  };

  // Get assignment for this specific service time (or regular service)
  const assignment = getAssignment
    ? getAssignment(date, serviceTime)
    : assignments[date] || {};
  const displayTitle = serviceTime ? `${title} - ${serviceTime}` : title;

  return (
    <div className="mb-4 p-4 bg-white rounded-lg shadow border">
      <div className="mb-2">
        <div className="font-medium text-black">{displayTitle}</div>
        <div className="text-sm text-black">
          {day}, {date}
        </div>
      </div>

      {/* Team Members Section */}
      <div className="space-y-2">
        {/* Team Member 1 */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-black">Team Member 1:</span>
          <div className="flex-1 ml-4">
            <div
              className={`p-2 rounded bg-red-700 ${isPastDate(date) ? "opacity-50" : "bg-opacity-20"} flex justify-between items-center`}
            >
              <span className="flex-1 text-center pr-2 text-black">
                {assignment?.team_member_1 || "Ben"}
              </span>
              <button
                onClick={() =>
                  onEditMember(
                    date,
                    1,
                    assignment?.team_member_1 || "Ben",
                    serviceTime,
                  )
                }
                className="text-red-500 hover:text-red-700 flex-shrink-0"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Team Member 2 */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-black">Team Member 2:</span>
          <div className="flex-1 ml-4">
            <div
              className={`p-2 rounded bg-red-700 ${isPastDate(date) ? "opacity-50" : "bg-opacity-20"} flex justify-between items-center`}
            >
              <span className="flex-1 text-center pr-2 text-black">
                {assignment?.team_member_2 || getRotationMember(index)}
              </span>
              <button
                onClick={() =>
                  onEditMember(
                    date,
                    2,
                    assignment?.team_member_2 || getRotationMember(index),
                    serviceTime,
                  )
                }
                className="text-red-500 hover:text-red-700 flex-shrink-0"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Team Member 3 */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-black">Team Member 3:</span>
          <div className="flex-1 ml-4">
            {assignment?.team_member_3 ? (
              <div
                className={`p-2 rounded bg-red-700 ${isPastDate(date) ? "opacity-50" : "bg-opacity-20"} flex justify-between items-center`}
              >
                <span className="flex-1 text-center pr-2 text-black">
                  {assignment.team_member_3}
                </span>
                <button
                  onClick={() => onRemoveAssignment(date, serviceTime)}
                  className="text-red-500 hover:text-red-700 flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onSignup(date, serviceTime)}
                className={`w-full p-2 border rounded text-red-700 border-red-700 hover:bg-red-50 ${isPastDate(date) ? "opacity-50" : ""}`}
              >
                Sign Up
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileAVTeamCard;
