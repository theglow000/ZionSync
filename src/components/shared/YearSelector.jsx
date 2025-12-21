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
      {/* Service Schedule on first line */}
      <div className={`font-bold text-gray-600 ${textSize} text-center`}>
        Service Schedule
      </div>

      {/* Year selector on second line */}
      <div className="relative inline-flex items-center justify-center mt-1">
        <span className={`font-medium text-gray-600 mr-2 ${textSize}`}>
          Year:
        </span>

        {/* Clickable wrapper for year + arrow - styled as button */}
        <label className="inline-flex items-center cursor-pointer relative">
          <select
            value={selectedYear || ""}
            onChange={handleYearChange}
            className={`appearance-none bg-white border-2 rounded-lg px-4 py-2 pr-10 font-bold text-gray-700 focus:outline-none cursor-pointer shadow-sm hover:shadow-md transition-shadow ${textSize}`}
            style={{
              borderColor: teamColor,
              width: "auto",
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

          {/* Dropdown arrow after the year */}
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none"
            style={{ color: teamColor }}
          >
            <ChevronDown className="h-5 w-5" />
          </div>
        </label>
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
