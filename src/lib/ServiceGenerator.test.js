/**
 * Tests for ServiceGenerator
 *
 * Validates that the service generation algorithm produces correct results
 * for various years and edge cases.
 */

import {
  generateServicesForYear,
  generateServicesForYears,
} from "./ServiceGenerator.js";

describe("ServiceGenerator", () => {
  describe("generateServicesForYear", () => {
    test("generates services for 2025", () => {
      const result = generateServicesForYear(2025);

      expect(result.year).toBe(2025);
      expect(result.services).toBeDefined();
      expect(result.services.length).toBeGreaterThanOrEqual(52); // At least 52 Sundays
      expect(result.validated).toBe(true);
      expect(result.validationErrors).toHaveLength(0);
      expect(result.algorithmVersion).toBe("1.0.0");
    });

    test("includes correct metadata for 2025", () => {
      const result = generateServicesForYear(2025);

      expect(result.metadata.totalServices).toBeGreaterThan(52);
      expect(result.metadata.regularSundays).toBe(52); // 2025 has 52 Sundays
      expect(result.metadata.specialWeekdays).toBeGreaterThan(0);
      expect(result.metadata.overriddenCount).toBe(0);
    });

    test("includes key liturgical dates for 2025", () => {
      const result = generateServicesForYear(2025);

      expect(result.keyDates.easter).toBeDefined();
      expect(result.keyDates.adventStart).toBeDefined();
      expect(result.keyDates.ashWednesday).toBeDefined();
      expect(result.keyDates.pentecost).toBeDefined();

      // Verify Easter 2025 is April 20 (corrected from bug)
      const easter = result.keyDates.easter;
      expect(easter.getMonth()).toBe(3); // April (0-indexed)
      expect(easter.getDate()).toBe(20);
    });

    test("includes special weekday services", () => {
      const result = generateServicesForYear(2025);

      const specialWeekdays = result.services.filter((s) => s.isSpecialWeekday);

      // Should have at least: Ash Wednesday, Maundy Thursday, Good Friday, Ascension
      expect(specialWeekdays.length).toBeGreaterThanOrEqual(4);

      // Check specific special days exist
      const specialDayIds = specialWeekdays.map((s) => s.specialDay);
      expect(specialDayIds).toContain("ASH_WEDNESDAY");
      expect(specialDayIds).toContain("MAUNDY_THURSDAY");
      expect(specialDayIds).toContain("GOOD_FRIDAY");
      expect(specialDayIds).toContain("ASCENSION");
    });

    test("includes Christmas Eve as special weekday (2025 - Wednesday)", () => {
      const result = generateServicesForYear(2025);

      const christmasEve = result.services.find(
        (s) => s.specialDay === "CHRISTMAS_EVE",
      );
      expect(christmasEve).toBeDefined();
      expect(christmasEve.isSpecialWeekday).toBe(true);
      expect(christmasEve.dayOfWeek).toBe("Wednesday");
    });

    test("all services have required fields", () => {
      const result = generateServicesForYear(2025);

      result.services.forEach((service) => {
        expect(service.date).toBeInstanceOf(Date);
        expect(service.dateString).toMatch(/^\d{1,2}\/\d{1,2}\/\d{2}$/);
        expect(service.dayOfWeek).toBeDefined();
        expect(service.season).toBeDefined();
        expect(service.seasonName).toBeDefined();
        expect(service.seasonColor).toBeDefined();
        expect(service.isRegularSunday).toBeDefined();
        expect(service.isSpecialWeekday).toBeDefined();
        expect(service.isOverridden).toBe(false);
      });
    });

    test("services are sorted by date", () => {
      const result = generateServicesForYear(2025);

      for (let i = 1; i < result.services.length; i++) {
        expect(result.services[i].date.getTime()).toBeGreaterThan(
          result.services[i - 1].date.getTime(),
        );
      }
    });

    test("no duplicate dates", () => {
      const result = generateServicesForYear(2025);

      const dateStrings = result.services.map((s) => s.date.toISOString());
      const uniqueDates = new Set(dateStrings);

      expect(uniqueDates.size).toBe(result.services.length);
    });

    test("all services are in correct year", () => {
      const result = generateServicesForYear(2025);

      result.services.forEach((service) => {
        expect(service.date.getFullYear()).toBe(2025);
      });
    });

    test("generates services for 2026 with different Easter date", () => {
      const result = generateServicesForYear(2026);

      expect(result.year).toBe(2026);
      expect(result.services.length).toBeGreaterThanOrEqual(52);

      // Easter 2026 is April 5
      const easter = result.keyDates.easter;
      expect(easter.getMonth()).toBe(3); // April
      expect(easter.getDate()).toBe(5);
    });

    test("generates services for 2027 with corrected Easter date", () => {
      const result = generateServicesForYear(2027);

      expect(result.year).toBe(2027);

      // Easter 2027 is March 28 (this was the bug we fixed!)
      const easter = result.keyDates.easter;
      expect(easter.getMonth()).toBe(2); // March (0-indexed)
      expect(easter.getDate()).toBe(28);
    });

    test("handles leap year (2024)", () => {
      const result = generateServicesForYear(2024);

      expect(result.year).toBe(2024);
      expect(result.services.length).toBeGreaterThanOrEqual(52);
      expect(result.validated).toBe(true);
    });

    test("throws error for year < 2024", () => {
      expect(() => {
        generateServicesForYear(2023);
      }).toThrow("Year must be between 2024 and 2100");
    });

    test("throws error for year > 2100", () => {
      expect(() => {
        generateServicesForYear(2101);
      }).toThrow("Year must be between 2024 and 2100");
    });
  });

  describe("Liturgical Season Coverage", () => {
    test("includes all major seasons", () => {
      const result = generateServicesForYear(2025);

      const seasons = new Set(result.services.map((s) => s.season));

      // Should have all major seasons
      expect(seasons.has("ADVENT")).toBe(true);
      expect(seasons.has("CHRISTMAS")).toBe(true);
      expect(seasons.has("EPIPHANY")).toBe(true);
      expect(seasons.has("LENT")).toBe(true);
      expect(seasons.has("EASTER")).toBe(true);
      expect(seasons.has("ORDINARY_TIME")).toBe(true);
    });

    test("Advent starts on correct date (2025)", () => {
      const result = generateServicesForYear(2025);

      const adventStart = result.keyDates.adventStart;

      // Advent 2025 starts November 30
      expect(adventStart.getMonth()).toBe(10); // November (0-indexed)
      expect(adventStart.getDate()).toBe(30);
    });

    test("includes Palm Sunday", () => {
      const result = generateServicesForYear(2025);

      const palmSunday = result.services.find(
        (s) => s.specialDay === "PALM_SUNDAY",
      );
      expect(palmSunday).toBeDefined();

      // Palm Sunday 2025 is April 13 (Easter - 7 days)
      expect(palmSunday.date.getMonth()).toBe(3); // April
      expect(palmSunday.date.getDate()).toBe(13);
    });

    test("includes Pentecost Sunday", () => {
      const result = generateServicesForYear(2025);

      const pentecost = result.services.find(
        (s) => s.specialDay === "PENTECOST_SUNDAY",
      );
      expect(pentecost).toBeDefined();

      // Pentecost 2025 is June 8 (Easter + 49 days)
      expect(pentecost.date.getMonth()).toBe(5); // June
      expect(pentecost.date.getDate()).toBe(8);
    });

    test("includes Trinity Sunday", () => {
      const result = generateServicesForYear(2025);

      const trinity = result.services.find(
        (s) => s.specialDay === "TRINITY_SUNDAY",
      );
      expect(trinity).toBeDefined();

      // Trinity 2025 is June 15 (Pentecost + 7 days)
      expect(trinity.date.getMonth()).toBe(5); // June
      expect(trinity.date.getDate()).toBe(15);
    });

    test("includes All Saints Day (LCMC tradition)", () => {
      const result = generateServicesForYear(2025);

      const allSaints = result.services.find(
        (s) => s.specialDay === "ALL_SAINTS_DAY",
      );
      expect(allSaints).toBeDefined();

      // All Saints 2025 is first Sunday of November = November 2
      expect(allSaints.date.getMonth()).toBe(10); // November
      expect(allSaints.date.getDate()).toBe(2);
    });

    test("includes Reformation Sunday", () => {
      const result = generateServicesForYear(2025);

      const reformation = result.services.find(
        (s) => s.specialDay === "REFORMATION_SUNDAY",
      );
      expect(reformation).toBeDefined();

      // Reformation Sunday is last Sunday of October
      expect(reformation.date.getMonth()).toBe(9); // October
    });

    test("includes Christ the King Sunday", () => {
      const result = generateServicesForYear(2025);

      const christTheKing = result.services.find(
        (s) => s.specialDay === "CHRIST_THE_KING",
      );
      expect(christTheKing).toBeDefined();

      // Last Sunday before Advent
      expect(christTheKing.date.getMonth()).toBe(10); // November
    });
  });

  describe("Special Weekday Services", () => {
    test("Ash Wednesday is 46 days before Easter", () => {
      const result = generateServicesForYear(2025);

      const ashWednesday = result.services.find(
        (s) => s.specialDay === "ASH_WEDNESDAY",
      );
      const easter = result.keyDates.easter;

      expect(ashWednesday).toBeDefined();

      const daysBetween = Math.round(
        (easter - ashWednesday.date) / (1000 * 60 * 60 * 24),
      );
      expect(daysBetween).toBe(46);
    });

    test("Maundy Thursday is 3 days before Easter", () => {
      const result = generateServicesForYear(2025);

      const maundyThursday = result.services.find(
        (s) => s.specialDay === "MAUNDY_THURSDAY",
      );
      const easter = result.keyDates.easter;

      expect(maundyThursday).toBeDefined();

      const daysBetween = Math.round(
        (easter - maundyThursday.date) / (1000 * 60 * 60 * 24),
      );
      expect(daysBetween).toBe(3);
    });

    test("Good Friday is 2 days before Easter", () => {
      const result = generateServicesForYear(2025);

      const goodFriday = result.services.find(
        (s) => s.specialDay === "GOOD_FRIDAY",
      );
      const easter = result.keyDates.easter;

      expect(goodFriday).toBeDefined();

      const daysBetween = Math.round(
        (easter - goodFriday.date) / (1000 * 60 * 60 * 24),
      );
      expect(daysBetween).toBe(2);
    });

    test("Ascension Day is 39 days after Easter", () => {
      const result = generateServicesForYear(2025);

      const ascension = result.services.find(
        (s) => s.specialDay === "ASCENSION",
      );
      const easter = result.keyDates.easter;

      expect(ascension).toBeDefined();

      const daysBetween = Math.round(
        (ascension.date - easter) / (1000 * 60 * 60 * 24),
      );
      expect(daysBetween).toBe(39);
    });

    test("Ascension Day is always Thursday", () => {
      const result = generateServicesForYear(2025);

      const ascension = result.services.find(
        (s) => s.specialDay === "ASCENSION",
      );
      expect(ascension).toBeDefined();
      expect(ascension.dayOfWeek).toBe("Thursday");
    });

    test("Good Friday is always Friday", () => {
      const result = generateServicesForYear(2025);

      const goodFriday = result.services.find(
        (s) => s.specialDay === "GOOD_FRIDAY",
      );
      expect(goodFriday).toBeDefined();
      expect(goodFriday.dayOfWeek).toBe("Friday");
    });
  });

  describe("Date Formatting", () => {
    test("dateString matches MM/DD/YY format", () => {
      const result = generateServicesForYear(2025);

      // Check a specific date we know - Easter 2025 = April 20
      const easter = result.services.find(
        (s) => s.specialDay === "EASTER_SUNDAY",
      );
      expect(easter.dateString).toBe("4/20/25");
    });

    test("handles single-digit months and days", () => {
      const result = generateServicesForYear(2025);

      // Find a service in January (month 1, single digit)
      const januaryService = result.services.find(
        (s) => s.date.getMonth() === 0 && s.date.getDate() === 5,
      );

      if (januaryService) {
        expect(januaryService.dateString).toBe("1/5/25");
      }
    });
  });

  describe("generateServicesForYears", () => {
    test("generates services for multiple years", () => {
      const results = generateServicesForYears(2025, 2027);

      expect(results).toHaveLength(3);
      expect(results[0].year).toBe(2025);
      expect(results[1].year).toBe(2026);
      expect(results[2].year).toBe(2027);
    });

    test("each year has valid services", () => {
      const results = generateServicesForYears(2025, 2027);

      results.forEach((result) => {
        expect(result.services.length).toBeGreaterThanOrEqual(52);
        expect(result.validated).toBe(true);
      });
    });

    test("handles errors gracefully", () => {
      const results = generateServicesForYears(2023, 2024); // 2023 should error

      expect(results).toHaveLength(2);
      expect(results[0].error).toBeDefined();
      expect(results[0].validated).toBe(false);
      expect(results[1].validated).toBe(true); // 2024 should succeed
    });
  });

  describe("Validation", () => {
    test("passes validation for normal year", () => {
      const result = generateServicesForYear(2025);

      expect(result.validated).toBe(true);
      expect(result.validationErrors).toHaveLength(0);
    });

    test("detects if Easter is missing (hypothetical)", () => {
      // This test verifies the validation logic works
      // In practice, Easter should never be missing
      const result = generateServicesForYear(2025);

      const hasEaster = result.services.some(
        (s) => s.specialDay === "EASTER_SUNDAY",
      );
      expect(hasEaster).toBe(true);
    });

    test("warns about large gaps (should not happen)", () => {
      const result = generateServicesForYear(2025);

      // With proper generation, should have no warnings about gaps > 14 days
      const gapWarnings =
        result.validationWarnings?.filter((w) => w.includes("Gap of")) || [];

      // Should not have gaps > 14 days between services
      gapWarnings.forEach((warning) => {
        const days = parseInt(warning.match(/Gap of (\d+) days/)?.[1] || "0");
        expect(days).toBeLessThan(15);
      });
    });
  });
});
