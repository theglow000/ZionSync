/**
 * Single source of truth for mapping worship-team song selections onto
 * order-of-worship elements.
 *
 * Both the Worship tab (ServiceSongSelector) and POST /api/service-songs
 * import this module. They previously each had their own copy, which
 * disagreed about the shape of `selection` and about unfilled slots.
 *
 * Slot identity is the element's ordinal position among `song_hymn`
 * elements: the Nth song_hymn element owns slot `song_N` (the same rule the
 * picker uses to build its slots). Selections are looked up BY THAT KEY,
 * never by position in an array of values -- a blank slot is dropped from
 * the stored map, so positional consumption silently shifts every later
 * song up by one.
 *
 * `liturgical_song` elements (Kyrie, Alleluia, Create In Me, ...) recur
 * most Sundays and are never selected by the worship team. They are not
 * slots and must never be counted here.
 */

export const SONG_SLOT_PREFIX = "song_";
export const AWAITING_SELECTION = "<Awaiting Song Selection>";

/** The element type that creates a worship-team selection slot. */
export const SELECTABLE_SONG_TYPE = "song_hymn";

export function slotKeyForIndex(index) {
  return `${SONG_SLOT_PREFIX}${index}`;
}

/**
 * The pastor-authored label for a line, with any song details stripped.
 * "Opening Hymn: Amazing Grace #123 (Cranberry)" -> "Opening Hymn"
 */
export function labelForElement(element) {
  return (element?.content || "").split(":")[0].split(" - ")[0].trim();
}

export function formatHymnalName(hymnal) {
  if (!hymnal) return "";
  return hymnal.charAt(0).toUpperCase() + hymnal.slice(1);
}

export function formatSongDetails(song) {
  if (song?.type === "hymn") {
    return `${song.title} #${song.number} (${formatHymnalName(song.hymnal)})`;
  }
  return song?.author ? `${song.title} - ${song.author}` : `${song?.title}`;
}

/**
 * Returns a new elements array with each song_hymn line rewritten from
 * `selectionsBySlot`. Non-song elements are returned untouched.
 *
 * @param {Array<object>} elements order-of-worship elements
 * @param {object} selectionsBySlot map keyed "song_0", "song_1", ...
 * @returns {Array<object>}
 */
export function applySelectionsToElements(elements, selectionsBySlot) {
  if (!Array.isArray(elements)) return [];
  const selections = selectionsBySlot || {};
  let songIndex = 0;

  return elements.map((element) => {
    if (element?.type !== SELECTABLE_SONG_TYPE) return element;

    const slot = slotKeyForIndex(songIndex);
    songIndex += 1;

    const song = selections[slot];
    const label = labelForElement(element);

    if (!song?.title) {
      return {
        ...element,
        selection: null,
        content: `${label}: ${AWAITING_SELECTION}`,
      };
    }

    return {
      ...element,
      selection: { ...song, content: label },
      content: `${label}: ${formatSongDetails(song)}`,
    };
  });
}
