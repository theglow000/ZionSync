/**
 * Single implementation of "what kind of order-of-worship line is this".
 *
 * Previously duplicated four times (twice in PastorServiceInput, once in the
 * service-details API route, once in AddCustomService), with no test binding
 * them to the authored templates. They had already drifted.
 *
 * The two song categories are deliberately kept in separate vocabularies:
 *
 *   SONG_HYMN       - a slot the worship team must fill each week.
 *   LITURGICAL_SONG - a recurring sung element (Kyrie, Alleluia, ...) that
 *                     is sung most Sundays and is NEVER selected.
 *
 * Mixing them is a real hazard: a hymn slot misfiled as a liturgical song
 * silently disappears from the worship team's list.
 */
import stringSimilarity from "string-similarity";

export const ELEMENT_TYPES = {
  LITURGY: "liturgy",
  SONG_HYMN: "song_hymn",
  LITURGICAL_SONG: "liturgical_song",
  READING: "reading",
  MESSAGE: "message",
};

/** Labels that create a worship-team selection slot. */
export const HYMN_SLOT_TERMS = [
  "hymn:",
  "hymn of the day",
  "opening hymn",
  "sending song",
  "sending hymn",
  "closing hymn",
  "anthem:",
  "song:",
];

/** Recurring sung elements. Never selected by the worship team. */
export const LITURGICAL_SONG_TERMS = [
  "kyrie",
  "alleluia",
  "gospel acclamation",
  "canticle",
  "create in me",
  "change my heart",
  "lamb of god",
  "glory to god",
  "this is the feast",
  "hymn of praise",
  "lord's prayer-sung",
];

export const READING_TERMS = [
  "reading:",
  "lesson:",
  "psalm:",
  "gospel:",
  "first reading",
  "second reading",
  "gospel reading",
  "psalm reading",
];

export const MESSAGE_TERMS = ["sermon:", "message:"];

const includesAny = (haystack, terms) =>
  terms.some((term) => haystack.includes(term));

/**
 * @param {string} line a single order-of-worship line
 * @returns {string} one of ELEMENT_TYPES
 */
export function classifyLine(line) {
  const lower = (line || "").toLowerCase().trim();
  if (!lower) return ELEMENT_TYPES.LITURGY;

  // A children's message is liturgy, not a sermon. Checked first because
  // "message" would otherwise match MESSAGE_TERMS.
  if (lower.includes("children")) return ELEMENT_TYPES.LITURGY;

  // Hymn slots outrank liturgical songs: "Opening Hymn" must never be
  // demoted to a non-selectable liturgical song.
  if (includesAny(lower, HYMN_SLOT_TERMS)) return ELEMENT_TYPES.SONG_HYMN;

  if (includesAny(lower, LITURGICAL_SONG_TERMS))
    return ELEMENT_TYPES.LITURGICAL_SONG;
  if (includesAny(lower, READING_TERMS)) return ELEMENT_TYPES.READING;
  if (includesAny(lower, MESSAGE_TERMS)) return ELEMENT_TYPES.MESSAGE;

  return ELEMENT_TYPES.LITURGY;
}

/**
 * Display-cased terms the custom service editor can offer as "Did you mean".
 * Accepting one replaces the line's text, so these are written the way a
 * pastor would write them.
 */
export const SUGGESTION_TERMS = [
  "Opening Hymn",
  "Hymn of the Day",
  "Sending Song",
  "Kyrie",
  "Alleluia",
  "Gospel Acclamation",
  "Canticle",
  "Create in Me",
  "Change My Heart O God",
  "Lamb of God",
  "Glory to God",
  "This is the Feast",
  "First Reading",
  "Second Reading",
  "Gospel Reading",
  "Psalm Reading",
  "Confession and Forgiveness",
  "Apostle's Creed",
  "Prayer of the Day",
  "Blessing",
  "Peace",
  "Offering",
  "Communion",
  "Distribution",
  "Prelude",
  "Postlude",
  "Dismissal",
  "Greeting",
  "Announcements",
];

/**
 * Suggests a known term for a line that contains none, for the custom
 * service editor's "Did you mean" hint.
 *
 * @returns {{suggestion: string, rating: number} | null}
 */
export function suggestTermForLine(line) {
  const lower = (line || "").toLowerCase().trim();
  if (!lower) return null;

  const known = [
    ...HYMN_SLOT_TERMS,
    ...LITURGICAL_SONG_TERMS,
    ...READING_TERMS,
    ...MESSAGE_TERMS,
    ...SUGGESTION_TERMS.map((term) => term.toLowerCase()),
  ];
  if (known.some((term) => lower.includes(term))) return null;

  const matches = stringSimilarity.findBestMatch(
    lower,
    SUGGESTION_TERMS.map((term) => term.toLowerCase()),
  );
  // Multi-word lines must be very close before we suggest anything
  const threshold = lower.includes(" ") ? 0.8 : 0.6;
  if (matches.bestMatch.rating > threshold) {
    return {
      suggestion: SUGGESTION_TERMS[matches.bestMatchIndex],
      rating: matches.bestMatch.rating,
    };
  }
  return null;
}
