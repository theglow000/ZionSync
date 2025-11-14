import React, { useMemo } from "react";
import { ChevronDown } from "lucide-react";

/**
 * YearSelector Component
 *
 * Reusable year selector for choosing which year's services to display
 * Shows past generated years + current year + 3 future years
 * Grayed out/disabled for years without generated services
 *
 * @param {number} selectedYear - Currently selected year
 * @param {function} setSelectedYear - Function to update selected year
 * @param {array} availableYears - Years with generated services
 * @param {string} teamColor - Hex color for team branding (e.g., '#6B8E23')
 * @param {string} className - Additional CSS classes
 * @param {string} textSize - Text size class (default: 'text-2xl') - should match surrounding text
 */
const YearSelector = ({
  selectedYear,
  setSelectedYear,
  availableYears = [],
  teamColor = "#6B8E23",
  className = "",
  textSize = "text-2xl", // Allow customization for mobile vs desktop
}) => {
  // Calculate year range: past generated years + current + 3 future
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();

    // Get past years with data
    const pastYears = availableYears.filter((y) => y < currentYear);

    // Build range: past + current + 3 future
    const rangeSet = new Set([
      ...pastYears,
      currentYear,
      currentYear + 1,
      currentYear + 2,
      currentYear + 3,
    ]);

    // Convert to sorted array
    return Array.from(rangeSet).sort((a, b) => a - b);
  }, [availableYears]);

  const handleYearChange = (e) => {
    const year = parseInt(e.target.value);
    // Only allow selection of generated years
    if (availableYears.includes(year)) {
      setSelectedYear(year);
    }
  };

  const isYearAvailable = (year) => availableYears.includes(year);

  const currentYear = new Date().getFullYear();

  return (
    <div className={`relative inline-block ${className}`}>
      <div className="relative inline-flex items-center">
        {/* Clickable wrapper for arrow + year */}
        <label className="inline-flex items-center cursor-pointer">
          {/* Dropdown arrow before the year */}
          <div className="flex items-center mr-1" style={{ color: teamColor }}>
            <ChevronDown className="h-4 w-4" />
          </div>

          <select
            value={selectedYear || ""}
            onChange={handleYearChange}
            className={`appearance-none bg-transparent border-0 font-bold text-gray-600 focus:outline-none cursor-pointer ${textSize}`}
            style={{
              color: "inherit",
              width: "auto",
              paddingRight: "0.25rem",
            }}
          >
            {yearOptions.map((year) => {
              const available = isYearAvailable(year);
              const isCurrent = year === currentYear;

              return (
                <option
                  key={year}
                  value={year}
                  disabled={!available}
                  className={`
                    ${!available ? "text-gray-400" : "text-gray-900"}
                    ${isCurrent ? "font-bold" : ""}
                  `}
                >
                  {year}
                  {!available ? " (Not Generated)" : ""}
                </option>
              );
            })}
          </select>
        </label>

        {/* "Service Schedule" text as plain text (not clickable) */}
        <span className={`font-bold text-gray-600 ${textSize}`}>
          {" "}
          Service Schedule
        </span>
      </div>

      {/* Tooltip for unavailable years */}
      {selectedYear && !isYearAvailable(selectedYear) && (
        <div className="absolute top-full left-0 mt-2 bg-gray-900 text-white text-xs rounded px-3 py-2 whitespace-nowrap z-50 shadow-lg">
          Services for {selectedYear} not generated yet. Generate in Settings.
          <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
        </div>
      )}
    </div>
  );
};

export default YearSelector;
