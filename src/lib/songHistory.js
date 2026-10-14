/**
 * "When did we last sing this?" -- derived live from the songs currently
 * picked on every service, never stored, so it follows other teams adding,
 * swapping or removing songs on dates before this one.
 */
import { parseServiceDate } from "./avRotation";
import { serviceDayName } from "./serviceDayName";

/** Same song despite case, spacing and punctuation differences. */
export const normalizeTitle = (title) =>
  (title || "").toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * @param {Array<{date: string, selections: object}>} serviceSongs every
 *   service_songs document
 * @returns {{date: string, notes: string} | null} the latest service strictly
 *   before `beforeDate` that has this song
 */
export function findPreviousUse(serviceSongs, title, beforeDate) {
  const key = normalizeTitle(title);
  if (!key) return null;
  const before = parseServiceDate(beforeDate);

  let best = null;
  for (const doc of serviceSongs || []) {
    if (!doc?.date) continue;
    const when = parseServiceDate(doc.date);
    if (!(when < before) || (best && when <= best.when)) continue;
    const match = Object.values(doc.selections || {}).find(
      (s) => normalizeTitle(s?.title) === key,
    );
    if (match) best = { when, date: doc.date, notes: match.notes || "" };
  }
  return best && { date: best.date, notes: best.notes };
}

const lines = (notes) =>
  (notes || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

/** Lines of a note that say which verses were sung. */
export const verseLines = (notes) =>
  lines(notes).filter((l) => /\bverses?\b/i.test(l));

/** A previous note, minus the hand-typed "Last sung/used ..." lines. */
export const notesToCopy = (notes) =>
  lines(notes)
    .filter((l) => !/^last (sung|used)\b/i.test(l))
    .join("\n");

const longDate = (dateStr) =>
  parseServiceDate(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

/** @param {string} today "M/D/YY" in the viewer's own calendar */
export function describePreviousUse(prev, today) {
  const ahead = parseServiceDate(prev.date) > parseServiceDate(today);
  return {
    verb: ahead ? "Scheduled" : "Last sung",
    date: longDate(prev.date),
    dayName: serviceDayName(prev.date),
  };
}
