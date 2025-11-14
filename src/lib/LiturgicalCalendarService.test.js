/**
 * Tests for the Liturgical Calendar Service
 */
import {
  calculateEaster,
  calculateAdventStart,
  calculateAshWednesday,
  getCurrentSeason,
  getSpecialDay,
  getSeasonColor,
  getLiturgicalInfo,
  clearCache,
  isReformationSunday,
  isAllSaintsDay,
  isChristTheKingSunday,
  validateEasterDate,
  validateLiturgicalDate,
  validateServiceDateRange,
} from "./LiturgicalCalendarService";

import { LITURGICAL_SEASONS, MAJOR_FEAST_DAYS } from "./LiturgicalSeasons";

describe("LiturgicalCalendarService", () => {
  beforeEach(() => {
    // Clear cache between tests
    clearCache();
  });

  describe("calculateEaster", () => {
    test("calculates Easter 2024 correctly (leap year with early Easter)", () => {
      const easter2024 = calculateEaster(2024);
      expect(easter2024.getFullYear()).toBe(2024);
      expect(easter2024.getMonth()).toBe(2); // March
      expect(easter2024.getDate()).toBe(31); // March 31, 2024
    });

    test("calculates Easter 2025 correctly", () => {
      const easter2025 = calculateEaster(2025);
      expect(easter2025.getFullYear()).toBe(2025);
      expect(easter2025.getMonth()).toBe(3); // April
      expect(easter2025.getDate()).toBe(20); // April 20, 2025
    });

    test("calculates Easter 2026 correctly", () => {
      const easter2026 = calculateEaster(2026);
      expect(easter2026.getFullYear()).toBe(2026);
      expect(easter2026.getMonth()).toBe(3); // April
      expect(easter2026.getDate()).toBe(5); // April 5, 2026
    });

    test("calculates Easter 2027 correctly (early March Easter)", () => {
      const easter2027 = calculateEaster(2027);
      expect(easter2027.getFullYear()).toBe(2027);
      expect(easter2027.getMonth()).toBe(2); // March
      expect(easter2027.getDate()).toBe(28); // March 28, 2027
    });

    test("calculates Easter 2038 correctly (distant future)", () => {
      const easter2038 = calculateEaster(2038);
      expect(easter2038.getFullYear()).toBe(2038);
      expect(easter2038.getMonth()).toBe(3); // April
      expect(easter2038.getDate()).toBe(25); // April 25, 2038
    });

    test("calculates Easter 2100 correctly (century boundary)", () => {
      const easter2100 = calculateEaster(2100);
      expect(easter2100.getFullYear()).toBe(2100);
      expect(easter2100.getMonth()).toBe(3); // April
      expect(easter2100.getDate()).toBe(28); // April 28, 2100
    });
  });

  describe("calculateAdventStart", () => {
    test("calculates first Sunday of Advent 2024 correctly", () => {
      const advent2024 = calculateAdventStart(2024);
      expect(advent2024.getFullYear()).toBe(2024);
      expect(advent2024.getMonth()).toBe(11); // December
      expect(advent2024.getDate()).toBe(1); // December 1, 2024
      expect(advent2024.getDay()).toBe(0); // Sunday
    });

    test("calculates first Sunday of Advent 2025 correctly", () => {
      const advent2025 = calculateAdventStart(2025);
      expect(advent2025.getFullYear()).toBe(2025);
      expect(advent2025.getMonth()).toBe(10); // November
      expect(advent2025.getDate()).toBe(30); // November 30, 2025
      expect(advent2025.getDay()).toBe(0); // Sunday
    });

    test("calculates first Sunday of Advent 2038 correctly", () => {
      const advent2038 = calculateAdventStart(2038);
      expect(advent2038.getFullYear()).toBe(2038);
      expect(advent2038.getMonth()).toBe(10); // November
      expect(advent2038.getDate()).toBe(28); // November 28, 2038
      expect(advent2038.getDay()).toBe(0); // Sunday
    });
  });

  describe("calculateAshWednesday", () => {
    test("calculates Ash Wednesday 2024 correctly", () => {
      const ashWednesday = calculateAshWednesday(2024);
      expect(ashWednesday.getFullYear()).toBe(2024);
      expect(ashWednesday.getMonth()).toBe(1); // February
      expect(ashWednesday.getDate()).toBe(14); // February 14, 2024
      expect(ashWednesday.getDay()).toBe(3); // Wednesday
    });

    test("calculates Ash Wednesday 2026 correctly", () => {
      const ashWednesday = calculateAshWednesday(2026);
      expect(ashWednesday.getFullYear()).toBe(2026);
      expect(ashWednesday.getMonth()).toBe(1); // February
      expect(ashWednesday.getDate()).toBe(18); // February 18, 2026
      expect(ashWednesday.getDay()).toBe(3); // Wednesday
    });
  });

  describe("getCurrentSeason", () => {
    test("identifies Advent correctly", () => {
      const date = new Date(2025, 11, 1); // December 1, 2025
      expect(getCurrentSeason(date)).toBe("ADVENT");
    });

    test("identifies Christmas correctly", () => {
      const date = new Date(2025, 11, 25); // December 25, 2025
      expect(getCurrentSeason(date)).toBe("CHRISTMAS");
    });

    test("identifies Epiphany correctly", () => {
      const date = new Date(2026, 0, 10); // January 10, 2026
      expect(getCurrentSeason(date)).toBe("EPIPHANY");
    });

    test("identifies Lent correctly", () => {
      const date = new Date(2026, 1, 20); // February 20, 2026 (during Lent)
      expect(getCurrentSeason(date)).toBe("LENT");
    });

    test("identifies Holy Week correctly", () => {
      const date = new Date(2026, 3, 2); // April 2, 2026 (Maundy Thursday)
      expect(getCurrentSeason(date)).toBe("HOLY_WEEK");
    });

    test("identifies Easter correctly", () => {
      const date = new Date(2026, 3, 10); // April 10, 2026 (during Easter season)
      expect(getCurrentSeason(date)).toBe("EASTER");
    });

    test("identifies Ordinary Time correctly", () => {
      // Previously would have been "EARLY_PENTECOST"
      const date = new Date(2026, 5, 15); // June 15, 2026
      expect(getCurrentSeason(date)).toBe("ORDINARY_TIME");

      // Previously would have been "LATE_PENTECOST"
      const date2 = new Date(2026, 9, 15); // October 15, 2026
      expect(getCurrentSeason(date2)).toBe("ORDINARY_TIME");
    });

    test("identifies Pentecost Day correctly", () => {
      const easter2026 = calculateEaster(2026);
      const pentecost = new Date(easter2026);
      pentecost.setDate(easter2026.getDate() + 49);
      expect(getCurrentSeason(pentecost)).toBe("PENTECOST_DAY");
    });

    test("identifies Trinity Sunday correctly", () => {
      const easter2026 = calculateEaster(2026);
      const pentecost = new Date(easter2026);
      pentecost.setDate(easter2026.getDate() + 49);
      const trinity = new Date(pentecost);
      trinity.setDate(pentecost.getDate() + 7);
      expect(getCurrentSeason(trinity)).toBe("TRINITY");
    });

    test("identifies special days that override the season", () => {
      // Find a date for Reformation Sunday (last Sunday in October)
      const reformation = new Date(2026, 9, 25); // Last Sunday of Oct 2026
      expect(getCurrentSeason(reformation)).toBe("REFORMATION");

      // Christ the King Sunday
      const advent2026 = calculateAdventStart(2026);
      const christTheKing = new Date(advent2026);
      christTheKing.setDate(advent2026.getDate() - 7);
      expect(getCurrentSeason(christTheKing)).toBe("CHRIST_KING");
    });
  });

  describe("getSpecialDay", () => {
    test("identifies Christmas Day correctly", () => {
      const date = new Date(2025, 11, 25); // December 25, 2025
      expect(getSpecialDay(date)).toBe("CHRISTMAS_DAY");
    });

    test("identifies Easter Sunday correctly", () => {
      const easter = calculateEaster(2026);
      expect(getSpecialDay(easter)).toBe("EASTER_SUNDAY");
    });

    test("identifies Reformation Sunday correctly", () => {
      // Last Sunday in October 2025 should be October 26
      const date = new Date(2025, 9, 26);
      expect(getSpecialDay(date)).toBe("REFORMATION_SUNDAY");
    });

    test("identifies Trinity Sunday correctly (2024)", () => {
      // Trinity Sunday is the Sunday after Pentecost
      const easter2024 = calculateEaster(2024);
      const pentecost = new Date(easter2024);
      pentecost.setDate(easter2024.getDate() + 49);

      const trinitySunday = new Date(pentecost);
      trinitySunday.setDate(pentecost.getDate() + 7);

      expect(getSpecialDay(trinitySunday)).toBe("TRINITY_SUNDAY");
    });

    test("identifies All Saints Day correctly", () => {
      // LCMC Lutheran tradition: First Sunday of November
      // In 2025, Nov 1 is a Saturday, so first Sunday is Nov 2
      const allSaintsSunday = new Date(2025, 10, 2); // November 2, 2025
      expect(getSpecialDay(allSaintsSunday)).toBe("ALL_SAINTS_DAY");

      // In 2026, Nov 1 is a Sunday, so it's All Saints Day
      const allSaintsDay2026 = new Date(2026, 10, 1); // November 1, 2026
      expect(getSpecialDay(allSaintsDay2026)).toBe("ALL_SAINTS_DAY");
    });

    test("identifies Christ the King Sunday correctly", () => {
      // Christ the King is the Sunday before Advent
      const advent2025 = calculateAdventStart(2025);
      const christTheKingSunday = new Date(advent2025);
      christTheKingSunday.setDate(advent2025.getDate() - 7);

      expect(getSpecialDay(christTheKingSunday)).toBe("CHRIST_THE_KING");
    });

    test("identifies Thanksgiving correctly", () => {
      // Thanksgiving USA (4th Thursday in November)
      const thanksgiving2025 = new Date(2025, 10, 27); // November 27, 2025
      expect(getSpecialDay(thanksgiving2025)).toBe("THANKSGIVING");
    });

    test("identifies Maundy Thursday correctly", () => {
      // Maundy Thursday 2025 (Easter - 3 days)
      // Easter 2025 is April 20, so Maundy Thursday is April 17
      const maundyThursday2025 = new Date(2025, 3, 17); // April 17, 2025
      expect(getSpecialDay(maundyThursday2025)).toBe("MAUNDY_THURSDAY");

      // Maundy Thursday 2026 (Easter - 3 days)
      // Easter 2026 is April 5, so Maundy Thursday is April 2
      const maundyThursday2026 = new Date(2026, 3, 2); // April 2, 2026
      expect(getSpecialDay(maundyThursday2026)).toBe("MAUNDY_THURSDAY");
    });

    test("identifies Good Friday correctly", () => {
      // Good Friday 2025 (Easter - 2 days)
      // Easter 2025 is April 20, so Good Friday is April 18
      const goodFriday2025 = new Date(2025, 3, 18); // April 18, 2025
      expect(getSpecialDay(goodFriday2025)).toBe("GOOD_FRIDAY");

      // Good Friday 2026 (Easter - 2 days)
      // Easter 2026 is April 5, so Good Friday is April 3
      const goodFriday2026 = new Date(2026, 3, 3); // April 3, 2026
      expect(getSpecialDay(goodFriday2026)).toBe("GOOD_FRIDAY");
    });

    test("identifies Ascension Day correctly", () => {
      // Ascension 2025 (Easter + 39 days)
      // Easter 2025 is April 20, so Ascension is May 29 (always a Thursday)
      const ascension2025 = new Date(2025, 4, 29); // May 29, 2025
      expect(getSpecialDay(ascension2025)).toBe("ASCENSION");
      expect(ascension2025.getDay()).toBe(4); // Verify it's a Thursday

      // Ascension 2026 (Easter + 39 days)
      // Easter 2026 is April 5, so Ascension is May 14
      const ascension2026 = new Date(2026, 4, 14); // May 14, 2026
      expect(getSpecialDay(ascension2026)).toBe("ASCENSION");
      expect(ascension2026.getDay()).toBe(4); // Verify it's a Thursday
    });

    test("identifies Baptism of Our Lord correctly", () => {
      // Baptism of Our Lord 2025 (Sunday after Epiphany)
      // Epiphany 2025 is Jan 6 (Monday), so Baptism is Jan 12
      const baptism2025 = new Date(2025, 0, 12); // January 12, 2025
      expect(getSpecialDay(baptism2025)).toBe("BAPTISM_OF_OUR_LORD");

      // Baptism of Our Lord 2026 (Sunday after Epiphany)
      // Epiphany 2026 is Jan 6 (Tuesday), so Baptism is Jan 11
      const baptism2026 = new Date(2026, 0, 11); // January 11, 2026
      expect(getSpecialDay(baptism2026)).toBe("BAPTISM_OF_OUR_LORD");
    });

    test("returns null for ordinary days", () => {
      const date = new Date(2025, 6, 15); // July 15, 2025 - ordinary day
      expect(getSpecialDay(date)).toBeNull();
    });
  });

  describe("isReformationSunday", () => {
    test("correctly identifies Reformation Sunday in different years", () => {
      // 2024 - Last Sunday in October should be Oct 27
      expect(isReformationSunday(new Date(2024, 9, 27))).toBe(true);
      expect(isReformationSunday(new Date(2024, 9, 20))).toBe(false);

      // 2025 - Last Sunday in October should be Oct 26
      expect(isReformationSunday(new Date(2025, 9, 26))).toBe(true);
      expect(isReformationSunday(new Date(2025, 9, 19))).toBe(false);
    });
  });

  describe("isAllSaintsDay", () => {
    test("correctly identifies All Saints Day per LCMC Lutheran tradition", () => {
      // Lutheran tradition: First Sunday of November
      // 2024 - Nov 1 is a Friday, so first Sunday is Nov 3
      expect(isAllSaintsDay(new Date(2024, 10, 3))).toBe(true); // First Sunday

      // 2025 - Nov 1 is a Saturday, so first Sunday is Nov 2
      expect(isAllSaintsDay(new Date(2025, 10, 2))).toBe(true); // First Sunday

      // 2026 - Nov 1 is a Sunday, so it's the first Sunday
      expect(isAllSaintsDay(new Date(2026, 10, 1))).toBe(true); // Nov 1 is Sunday

      // Should NOT match Nov 1 when it's not Sunday
      expect(isAllSaintsDay(new Date(2024, 10, 1))).toBe(false); // Nov 1 is Friday
      expect(isAllSaintsDay(new Date(2025, 10, 1))).toBe(false); // Nov 1 is Saturday
    });
  });

  describe("getLiturgicalInfo", () => {
    test("returns complete info for a special day", () => {
      const date = new Date(2025, 11, 25); // Christmas Day
      const info = getLiturgicalInfo(date);

      expect(info).toEqual({
        date: date,
        season: LITURGICAL_SEASONS.CHRISTMAS,
        seasonId: "CHRISTMAS",
        specialDay: MAJOR_FEAST_DAYS.CHRISTMAS_DAY,
        specialDayId: "CHRISTMAS_DAY",
        color: MAJOR_FEAST_DAYS.CHRISTMAS_DAY.color,
      });
    });

    test("returns complete info for a regular season day", () => {
      const date = new Date(2025, 6, 15); // July 15, 2025 - now Ordinary Time
      const info = getLiturgicalInfo(date);

      expect(info).toEqual({
        date: date,
        season: LITURGICAL_SEASONS.ORDINARY_TIME,
        seasonId: "ORDINARY_TIME",
        specialDay: null,
        specialDayId: null,
        color: LITURGICAL_SEASONS.ORDINARY_TIME.color,
      });
    });

    test("handles distant future dates correctly", () => {
      const date = new Date(2050, 11, 25); // Christmas 2050
      const info = getLiturgicalInfo(date);

      expect(info.seasonId).toBe("CHRISTMAS");
      expect(info.specialDayId).toBe("CHRISTMAS_DAY");
    });
  });

  // Add these additional tests to ensure robustness
  describe("edge case handling", () => {
    test("handles Christmas to Epiphany transition correctly", () => {
      expect(getCurrentSeason(new Date(2026, 0, 5))).toBe("CHRISTMAS");
      expect(getCurrentSeason(new Date(2026, 0, 6))).toBe("EPIPHANY");
    });

    test("handles extreme early Easter correctly", () => {
      // March 22 is the earliest possible Easter
      const earlyEaster = new Date(2285, 2, 22);
      expect(getCurrentSeason(earlyEaster)).toBe("EASTER");
    });

    test("handles extreme late Easter correctly", () => {
      // April 25 is the latest possible Easter
      const lateEaster = new Date(2038, 3, 25);
      expect(getCurrentSeason(lateEaster)).toBe("EASTER");
    });
  });

  describe("Validation Functions", () => {
    describe("validateEasterDate", () => {
      test("validates correct Easter dates", () => {
        const result2025 = validateEasterDate(2025);
        expect(result2025.isValid).toBe(true);
        expect(result2025.calculatedDate.getMonth()).toBe(3);
        expect(result2025.calculatedDate.getDate()).toBe(20);

        const result2026 = validateEasterDate(2026);
        expect(result2026.isValid).toBe(true);
        expect(result2026.calculatedDate.getMonth()).toBe(3);
        expect(result2026.calculatedDate.getDate()).toBe(5);
      });

      test("validates earliest possible Easter (March 22)", () => {
        const result = validateEasterDate(2285);
        expect(result.isValid).toBe(true);
        expect(result.calculatedDate.getMonth()).toBe(2);
        expect(result.calculatedDate.getDate()).toBe(22);
      });

      test("validates latest possible Easter (April 25)", () => {
        const result = validateEasterDate(2038);
        expect(result.isValid).toBe(true);
        expect(result.calculatedDate.getMonth()).toBe(3);
        expect(result.calculatedDate.getDate()).toBe(25);
      });
    });

    describe("validateLiturgicalDate", () => {
      test("validates correct season identification", () => {
        const christmas = new Date(2025, 11, 25);
        const result = validateLiturgicalDate(christmas, "CHRISTMAS");
        expect(result.isValid).toBe(true);
        expect(result.calculatedSeason).toBe("CHRISTMAS");
      });

      test("detects incorrect season identification", () => {
        const christmas = new Date(2025, 11, 25);
        const result = validateLiturgicalDate(christmas, "ADVENT");
        expect(result.isValid).toBe(false);
        expect(result.expectedSeason).toBe("ADVENT");
        expect(result.calculatedSeason).toBe("CHRISTMAS");
      });

      test("validates Epiphany season starts Jan 6", () => {
        const epiphany = new Date(2025, 0, 6);
        const result = validateLiturgicalDate(epiphany, "EPIPHANY");
        expect(result.isValid).toBe(true);
      });
    });

    describe("validateServiceDateRange", () => {
      test("validates date range with no issues", () => {
        const dates = [
          new Date(2025, 0, 5),
          new Date(2025, 0, 12),
          new Date(2025, 0, 19),
          new Date(2025, 0, 26),
        ];
        const result = validateServiceDateRange(dates);
        expect(result.isValid).toBe(true);
        expect(result.duplicates).toHaveLength(0);
        expect(result.gaps).toHaveLength(0);
      });

      test("detects duplicate dates", () => {
        const dates = [
          new Date(2025, 0, 5),
          new Date(2025, 0, 5),
          new Date(2025, 0, 12),
        ];
        const result = validateServiceDateRange(dates);
        expect(result.isValid).toBe(false);
        expect(result.duplicates.length).toBeGreaterThan(0);
      });

      test("detects gaps in service dates", () => {
        const dates = [
          new Date(2025, 0, 5),
          new Date(2025, 0, 12),
          new Date(2025, 1, 2), // 3 weeks later - too big a gap
        ];
        const result = validateServiceDateRange(dates);
        expect(result.isValid).toBe(false);
        expect(result.gaps.length).toBeGreaterThan(0);
      });

      test("handles empty array", () => {
        const result = validateServiceDateRange([]);
        expect(result.isValid).toBe(false);
        expect(result.message).toContain("No service dates");
      });

      test("handles unsorted dates", () => {
        const dates = [
          new Date(2025, 0, 19),
          new Date(2025, 0, 5),
          new Date(2025, 0, 12),
          new Date(2025, 0, 26),
        ];
        const result = validateServiceDateRange(dates);
        expect(result.isValid).toBe(true); // Should still work with unsorted input
      });
    });
  });
});
