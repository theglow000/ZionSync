/**
 * A/V core rotation — pure scheduling logic shared by desktop, mobile and API.
 *
 * The schedule is a list of "epochs": snapshots of the core list, each with the
 * Sunday it takes effect. A service uses the latest epoch on or before its
 * date; services before the first epoch keep the legacy Ben + 3-person rule so
 * history never shifts. Turns are counted in calendar weeks, not service rows,
 * so adding a service never reshuffles anyone.
 */
import { AV_LEGACY_ROTATION_MEMBERS, AV_LEGACY_SLOT_1 } from "./constants";

const DAY_MS = 24 * 60 * 60 * 1000;

export const parseServiceDate = (str) => {
  const [month, day, year] = str.split("/").map(Number);
  return new Date(2000 + year, month - 1, day);
};

export const formatServiceDate = (date) =>
  `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear() % 100}`;

// Whole calendar days between two local dates; rounding absorbs DST hours.
const daysBetween = (from, to) => Math.round((to - from) / DAY_MS);

const weeksBetween = (fromStr, toStr) =>
  Math.floor(
    daysBetween(parseServiceDate(fromStr), parseServiceDate(toStr)) / 7,
  );

export const getEpochFor = (dateStr, epochs) => {
  const target = parseServiceDate(dateStr);
  let best = null;
  for (const epoch of epochs || []) {
    const start = parseServiceDate(epoch.effectiveDate);
    if (
      start <= target &&
      (!best || start > parseServiceDate(best.effectiveDate))
    ) {
      best = epoch;
    }
  }
  return best;
};

// Index of the member who takes slot 1 on turn t.
// Odd N: step two places each turn — everyone serves 2 of every N, never twice in a row.
// Even N: stepping by two would freeze the pairs, so after each full cycle
// (N/2 turns) the whole list shifts by one and partners change.
const startIndexForTurn = (n, t) => {
  if (n % 2 === 1) return (2 * t) % n;
  const perCycle = n / 2;
  const cycle = Math.floor(t / perCycle);
  return (cycle + 2 * (t % perCycle)) % n;
};

export const crewForTurn = (members, t) => {
  const n = members.length;
  const s = startIndexForTurn(n, t);
  return [members[s], members[(s + 1) % n]];
};

/**
 * Default crew for one service. Hand-picked names are applied by the caller.
 * @returns {{slot1: string|null, slot2: string|null, source: "legacy"|"rotation"|"signup"|"insufficient"}}
 */
export const getRotationCrew = ({ date, type, legacyIndex, epochs }) => {
  const epoch = getEpochFor(date, epochs);

  if (!epoch) {
    return {
      slot1: AV_LEGACY_SLOT_1,
      slot2:
        AV_LEGACY_ROTATION_MEMBERS[
          legacyIndex % AV_LEGACY_ROTATION_MEMBERS.length
        ],
      source: "legacy",
    };
  }

  if (type === "special") return { slot1: null, slot2: null, source: "signup" };

  if (epoch.members.length < 2) {
    return { slot1: null, slot2: null, source: "insufficient" };
  }

  const [slot1, slot2] = crewForTurn(
    epoch.members,
    weeksBetween(epoch.effectiveDate, date),
  );
  return { slot1, slot2, source: "rotation" };
};

// First Sunday on or after today + 7 days, so the coming week never changes.
const firstSundayAtLeastAWeekOut = (today) => {
  const d = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 7,
  );
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  return d;
};

/**
 * The epoch to write after the core list changes. Callers upsert it by
 * effectiveDate, so several changes before it takes effect collapse into one.
 */
export const buildNextEpoch = ({ epochs, coreNames, today }) => {
  let effective = firstSundayAtLeastAWeekOut(today);

  // Never slot a change in front of an epoch that already exists — it would be
  // overridden on that epoch's date (and would rewrite the seeded start).
  for (const epoch of epochs || []) {
    const start = parseServiceDate(epoch.effectiveDate);
    if (start > effective) effective = start;
  }
  const effectiveDate = formatServiceDate(effective);

  const base = getEpochFor(effectiveDate, epochs);
  let order = [];
  if (base) {
    order = base.members;
    if (base.effectiveDate !== effectiveDate && order.length > 0) {
      // Continue where the old rotation would have been on this date
      const s = startIndexForTurn(
        order.length,
        weeksBetween(base.effectiveDate, effectiveDate),
      );
      order = [...order.slice(s), ...order.slice(0, s)];
    }
  }

  const core = new Set(coreNames);
  const members = order.filter((name) => core.has(name));
  for (const name of coreNames) {
    if (!members.includes(name)) members.push(name);
  }

  return { effectiveDate, members };
};
