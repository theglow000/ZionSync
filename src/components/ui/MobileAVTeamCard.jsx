"use client";

import React from "react";
import { Trash2, Edit2 } from "lucide-react";
import {
  getSpecialServiceType,
  SpecialServiceIndicator,
  formatServiceTitle,
} from "../liturgical/LiturgicalStyling";

const MobileAVTeamCard = ({
  item,
  assignments,
  crew, // Default crew from getRotationCrew: { slot1, slot2, source }
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

  // Get assignment for this specific service time (or regular service)
  const assignment = getAssignment
    ? getAssignment(date, serviceTime)
    : assignments[date] || {};
  const formattedTitle = formatServiceTitle(item);
  const displayTitle = serviceTime
    ? `${formattedTitle} - ${serviceTime}`
    : formattedTitle;

  return (
    <div className="mb-4 p-4 bg-white rounded-lg shadow border">
      <div className="mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-black">{displayTitle}</span>
          {getSpecialServiceType(date) && (
            <SpecialServiceIndicator date={date} />
          )}
        </div>
        <div className="text-sm text-black">
          {day}, {date}
        </div>
      </div>

      {/* Team Members Section */}
      <div className="space-y-2">
        {[1, 2].map((position) => {
          const name =
            assignment?.[`team_member_${position}`] ||
            crew?.[`slot${position}`];
          return (
            <div key={position} className="flex justify-between items-center">
              <span className="text-sm text-black">
                Team Member {position}:
              </span>
              <div className="flex-1 ml-4">
                {name ? (
                  <div
                    className={`p-2 rounded bg-red-700 ${isPastDate(date) ? "opacity-50" : "bg-opacity-20"} flex justify-between items-center`}
                  >
                    <span className="flex-1 text-center pr-2 text-black">
                      {name}
                    </span>
                    <button
                      onClick={() =>
                        onEditMember(date, position, name, serviceTime)
                      }
                      className="text-red-500 hover:text-red-700 flex-shrink-0"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onSignup(date, serviceTime, position)}
                    className={`w-full p-2 border rounded text-red-700 border-red-700 hover:bg-red-50 ${isPastDate(date) ? "opacity-50" : ""}`}
                  >
                    Sign Up
                  </button>
                )}
              </div>
            </div>
          );
        })}

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
