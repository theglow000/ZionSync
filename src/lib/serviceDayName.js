/**
 * The church-calendar name of a service date, worded the way the worship
 * leader writes it: "5th Sunday of Epiphany", "21st Sunday after Pentecost",
 * or a named day ("Ash Wednesday"). Ordinary weekdays have no name.
 */
import {
  getLiturgicalInfo,
  calculateAdventStart,
  calculateAshWednesday,
  calculateEaster,
} from "./LiturgicalCalendarService";
import { parseServiceDate } from "./avRotation";

const DAY = 86400000;

// Special days the calendar knows by id but has no display name for, or
// whose display name isn't what the worship team says. null = count instead.
const NAME_OVERRIDES = {
  ADVENT_1: null,
  PENTECOST_SUNDAY: "Pentecost Sunday",
  REFORMATION_SUNDAY: "Reformation Sunday",
  ALL_SAINTS_DAY: "All Saints Sunday",
  CHRIST_THE_KING: "Christ the King Sunday",
  LENT_MIDWEEK: "Midweek Lenten Worship",
};

const ordinal = (n) => {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${{ 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th"}`;
};

// Sundays in (after, date] -- both local midnights; rounding absorbs DST.
const sundaysSince = (after, date) =>
  Math.floor(Math.round((date - after) / DAY + after.getDay()) / 7);

const midnight = (y, m, d) => new Date(y, m, d);

export function serviceDayName(dateStr) {
  const date = parseServiceDate(dateStr);
  const info = getLiturgicalInfo(date);

  if (info.specialDayId) {
    const override = NAME_OVERRIDES[info.specialDayId];
    if (override !== undefined) {
      if (override) return override;
    } else if (info.specialDay?.name) {
      return info.specialDay.name;
    }
  }
  if (date.getDay() !== 0) return null;

  const y = date.getFullYear();
  switch (info.seasonId) {
    case "ADVENT": {
      const start = calculateAdventStart(y);
      return `${ordinal(sundaysSince(new Date(start - DAY), date))} Sunday of Advent`;
    }
    case "CHRISTMAS": {
      const christmas =
        date.getMonth() === 11 ? midnight(y, 11, 25) : midnight(y - 1, 11, 25);
      return `${ordinal(sundaysSince(christmas, date))} Sunday of Christmas`;
    }
    case "EPIPHANY":
      return `${ordinal(sundaysSince(midnight(y, 0, 6), date))} Sunday of Epiphany`;
    case "LENT":
      return `${ordinal(sundaysSince(calculateAshWednesday(y), date))} Sunday of Lent`;
    case "EASTER": {
      const easter = calculateEaster(y);
      return `${ordinal(sundaysSince(easter, date) + 1)} Sunday of Easter`;
    }
    case "ORDINARY_TIME": {
      const pentecost = new Date(calculateEaster(y).getTime() + 49 * DAY);
      return `${ordinal(sundaysSince(pentecost, date))} Sunday after Pentecost`;
    }
    default:
      return null;
  }
}
