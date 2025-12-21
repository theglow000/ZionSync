"use client";

import React, { useState, useEffect } from "react";
import { X, Clock, AlertCircle } from "lucide-react";

const ServiceTimeModal = ({
  isOpen,
  onClose,
  dates,
  serviceTimeForDate,
  assignments,
  onAddServiceTime,
  onRemoveServiceTime,
  getAssignmentKey,
}) => {
  const [selectedDate, setSelectedDate] = useState("");
  const [serviceCount, setServiceCount] = useState(1);
  const [serviceTimes, setServiceTimes] = useState([
    { hour: "10", minute: "00", period: "AM" },
  ]);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    // Auto-select first date when modal opens
    if (isOpen && dates.length > 0 && !selectedDate) {
      setSelectedDate(dates[0].date);
    }
  }, [isOpen, dates, selectedDate]);

  useEffect(() => {
    // When date changes, load existing service times or reset
    if (selectedDate) {
      const existingTimes = serviceTimeForDate[selectedDate] || [];

      if (existingTimes.length > 0) {
        // Date has multiple services - load them
        setServiceCount(existingTimes.length);
        setServiceTimes(
          existingTimes.map((time) => {
            const [hourMin, period] = time.split(" ");
            const [hour, minute] = hourMin.split(":");
            return { hour, minute, period };
          }),
        );
      } else {
        // Regular service - default to 1
        setServiceCount(1);
        setServiceTimes([{ hour: "10", minute: "00", period: "AM" }]);
      }
    }
  }, [selectedDate, serviceTimeForDate]);

  useEffect(() => {
    // Adjust serviceTimes array when count changes
    setServiceTimes((prev) => {
      const newTimes = [...prev];
      while (newTimes.length < serviceCount) {
        newTimes.push({ hour: "10", minute: "00", period: "AM" });
      }
      while (newTimes.length > serviceCount) {
        newTimes.pop();
      }
      return newTimes;
    });
  }, [serviceCount]);

  if (!isOpen) return null;

  const selectedService = dates.find((d) => d.date === selectedDate);
  const existingTimes = serviceTimeForDate[selectedDate] || [];
  const hasExistingMultiple = existingTimes.length > 0;

  // Check if current date has assignments
  const regularKey = getAssignmentKey(selectedDate, null);
  const regularAssignment = assignments[regularKey];
  const hasRegularAssignments =
    regularAssignment &&
    (regularAssignment.team_member_1 ||
      regularAssignment.team_member_2 ||
      regularAssignment.team_member_3);

  const handleApply = async () => {
    if (!selectedDate || isApplying) return;

    setIsApplying(true);

    try {
      // Build time strings
      const newTimeStrings = serviceTimes.map(
        (t) => `${t.hour}:${t.minute} ${t.period}`,
      );

      // Validate: Check for duplicate times
      const uniqueTimes = new Set(newTimeStrings);
      if (uniqueTimes.size !== newTimeStrings.length) {
        alert(
          "Error: You have entered duplicate service times. Each service must have a unique time.",
        );
        return;
      }

      // If service count is 1, remove all service times (revert to regular)
      if (serviceCount === 1) {
        // Check if any service time has assignments
        let hasAnyAssignments = false;
        for (const time of existingTimes) {
          const key = getAssignmentKey(selectedDate, time);
          const assignment = assignments[key];
          if (
            assignment &&
            (assignment.team_member_1 ||
              assignment.team_member_2 ||
              assignment.team_member_3)
          ) {
            hasAnyAssignments = true;
            break;
          }
        }

        if (hasAnyAssignments) {
          const confirmed = window.confirm(
            "Warning: This will remove all specific service times and revert to a single service.\n\n" +
              "Some service times have team assignments. These assignments will be lost.\n\n" +
              "Continue?",
          );
          if (!confirmed) return;
        }

        for (const time of existingTimes) {
          await onRemoveServiceTime(selectedDate, time);
        }
        alert(`Service restored to single service with no specific time.`);
        onClose();
        return;
      }

      // Determine which times to remove (ones not in new list)
      const timesToRemove = existingTimes.filter(
        (t) => !newTimeStrings.includes(t),
      );

      // Check if any times being removed have assignments
      if (timesToRemove.length > 0) {
        let hasAssignmentsInRemoved = false;
        const assignmentDetails = [];

        for (const time of timesToRemove) {
          const key = getAssignmentKey(selectedDate, time);
          const assignment = assignments[key];
          if (
            assignment &&
            (assignment.team_member_1 ||
              assignment.team_member_2 ||
              assignment.team_member_3)
          ) {
            hasAssignmentsInRemoved = true;
            assignmentDetails.push(
              `  ${time}: ${[
                assignment.team_member_1,
                assignment.team_member_2,
                assignment.team_member_3,
              ]
                .filter(Boolean)
                .join(", ")}`,
            );
          }
        }

        if (hasAssignmentsInRemoved) {
          const confirmed = window.confirm(
            "Warning: The following service times have team assignments and will be removed:\n\n" +
              assignmentDetails.join("\n") +
              "\n\nAll these assignments will be permanently deleted.\n\n" +
              "Continue?",
          );
          if (!confirmed) return;
        }
      }

      // Remove old times that aren't in the new list
      for (const oldTime of timesToRemove) {
        await onRemoveServiceTime(selectedDate, oldTime);
      }

      // Add new times
      for (const newTime of newTimeStrings) {
        if (!existingTimes.includes(newTime)) {
          await onAddServiceTime(selectedDate, newTime);
        }
      }

      alert(
        `Service times configured successfully!\n\n` +
          `${selectedService.date} - ${selectedService.title}\n` +
          `Now has ${serviceCount} service${serviceCount === 1 ? "" : "s"}:\n` +
          newTimeStrings.map((t, i) => `  ${i + 1}. ${t}`).join("\n") +
          (hasRegularAssignments
            ? `\n\n✓ Existing team assignments moved to the first service (${newTimeStrings[0]}).`
            : ""),
      );

      onClose();
    } catch (error) {
      console.error("Error applying service times:", error);
      alert("Error: Failed to apply service time changes. Please try again.");
    } finally {
      setIsApplying(false);
    }
  };

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const minutes = ["00", "15", "30", "45"];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-red-700" />
            <h2 className="text-xl font-bold text-red-700">
              Configure Service Times
            </h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Service Date
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              {dates.map((dateItem) => (
                <option key={dateItem.date} value={dateItem.date}>
                  {dateItem.date} - {dateItem.day} - {dateItem.title}
                </option>
              ))}
            </select>
          </div>

          {/* Current State Info */}
          {selectedDate && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <div className="font-medium mb-1">Current Status:</div>
                  {hasExistingMultiple ? (
                    <div>
                      This date has{" "}
                      <strong>{existingTimes.length} services</strong> at{" "}
                      {existingTimes.join(", ")}
                    </div>
                  ) : hasRegularAssignments ? (
                    <div>
                      This date has <strong>1 service</strong> with team
                      assignments
                    </div>
                  ) : (
                    <div>
                      This date has <strong>1 service</strong> with no team
                      assignments
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Service Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How many service times do you need?
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((count) => (
                <button
                  key={count}
                  onClick={() => setServiceCount(count)}
                  className={`flex-1 py-3 px-4 rounded border-2 font-medium transition-colors ${
                    serviceCount === count
                      ? "border-red-700 bg-red-50 text-red-700"
                      : "border-gray-300 hover:border-gray-400 text-gray-700"
                  }`}
                >
                  {count} {count === 1 ? "Service" : "Services"}
                </button>
              ))}
            </div>
          </div>

          {/* Service Times Configuration */}
          {serviceCount > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Specify Time for Each Service
              </label>
              <div className="space-y-3">
                {serviceTimes.map((time, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="text-sm font-medium text-gray-700 w-20">
                      Service {index + 1}:
                    </div>
                    <select
                      value={time.hour}
                      onChange={(e) => {
                        const newTimes = [...serviceTimes];
                        newTimes[index].hour = e.target.value;
                        setServiceTimes(newTimes);
                      }}
                      className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500"
                    >
                      {hours.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                    <span className="text-gray-600">:</span>
                    <select
                      value={time.minute}
                      onChange={(e) => {
                        const newTimes = [...serviceTimes];
                        newTimes[index].minute = e.target.value;
                        setServiceTimes(newTimes);
                      }}
                      className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500"
                    >
                      {minutes.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <select
                      value={time.period}
                      onChange={(e) => {
                        const newTimes = [...serviceTimes];
                        newTimes[index].period = e.target.value;
                        setServiceTimes(newTimes);
                      }}
                      className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                    {index === 0 && hasRegularAssignments && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        ← Existing assignments will move here
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Box */}
          {serviceCount === 1 && hasExistingMultiple && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <div className="text-sm text-yellow-900">
                ⚠️ <strong>Note:</strong> Setting this to 1 service will remove
                all specific service times and revert to a single service.
              </div>
            </div>
          )}

          {serviceCount > 1 && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded">
              <div className="text-sm text-gray-700">
                💡 <strong>Tip:</strong> After applying, assign team members to
                each service time on the main A/V Team tab.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isApplying}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={isApplying}
            className="px-6 py-2 bg-red-700 text-white rounded hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isApplying ? "Applying..." : "Apply Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceTimeModal;
