import React, { useEffect, useState } from "react";
import {
  getLiturgicalInfoForService,
  getSeasonForDate,
  getSpecialDay,
  clearCache,
  calculateEaster,
  calculateAshWednesday,
  calculateAdventStart,
} from "../../lib/LiturgicalCalendarService.js";

export function LiturgicalDebugger() {
  const [results, setResults] = useState([]);

  useEffect(() => {
    // Force clear cache before starting tests
    clearCache();

    // Key dates to debug - these are the ones causing problems
    const datesToCheck = [
      { label: "Ash Wednesday", date: "3/5/25" },
      { label: "Easter Sunday", date: "4/20/25" },
      { label: "Advent 1", date: "11/30/25" },
      { label: "All Saints", date: "11/2/25" },
      { label: "Transfiguration", date: "3/2/25" },
      { label: "Palm Sunday", date: "4/13/25" },
      { label: "Christmas Eve", date: "12/24/25" },
    ];

    const testResults = datesToCheck.map((item) => {
      // Parse the date MM/DD/YY format to a proper Date object
      const [month, day, shortYear] = item.date.split("/").map(Number);
      const fullYear = 2000 + shortYear; // Convert 2-digit to 4-digit year
      const formattedDate = `${fullYear}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

      // Important: Clear cache before each individual test
      clearCache();

      // Create date object
      const dateObj = new Date(fullYear, month - 1, day);

      // Get data from our liturgical service
      const specialDay = getSpecialDay(dateObj);
      const season = getSeasonForDate(formattedDate);

      // Get expected key dates for verification
      const easter = calculateEaster(fullYear);
      const ashWednesday = calculateAshWednesday(fullYear);
      const adventStart = calculateAdventStart(fullYear);

      // Check if date matches any key dates
      const isEaster = dateObj.getTime() === easter.getTime();
      const isAshWednesday = dateObj.getTime() === ashWednesday.getTime();
      const isAdventStart = dateObj.getTime() === adventStart.getTime();

      return {
        ...item,
        formattedDate,
        dateObj,
        season,
        specialDay,
        keyDates: {
          isEaster,
          isAshWednesday,
          isAdventStart,
        },
        expectedSeason: getExpectedSeason(item.label),
      };
    });

    setResults(testResults);
  }, []);

  // Helper to provide the expected season for comparison
  function getExpectedSeason(label) {
    switch (label) {
      case "Ash Wednesday":
        return "LENT";
      case "Easter Sunday":
        return "EASTER";
      case "Advent 1":
        return "ADVENT";
      case "All Saints":
        return "ALL_SAINTS";
      case "Transfiguration":
        return "EPIPHANY"; // Last Sunday of Epiphany
      case "Palm Sunday":
        return "HOLY_WEEK"; // Palm Sunday starts Holy Week
      case "Christmas Eve":
        return "CHRISTMAS";
      default:
        return "UNKNOWN";
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Liturgical Calendar Debug</h2>

      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Testing boundary transitions between liturgical seasons. These dates
          should mark the beginning of their respective seasons.
        </p>
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date Label
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Calculated Season
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Expected Season
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Special Day
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Key Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {results.map((result, index) => (
            <tr
              key={index}
              className={
                result.season === result.expectedSeason
                  ? "bg-green-50"
                  : "bg-red-50"
              }
            >
              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                {result.label}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                {result.date}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                {result.season || "undefined"}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                {result.expectedSeason}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                {result.specialDay || "none"}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                {result.keyDates?.isEaster && "Easter"}
                {result.keyDates?.isAshWednesday && "Ash Wednesday"}
                {result.keyDates?.isAdventStart && "Advent Start"}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                {result.season === result.expectedSeason ? (
                  <span className="text-green-600">✓ Correct</span>
                ) : (
                  <span className="text-red-600">✗ Incorrect</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
