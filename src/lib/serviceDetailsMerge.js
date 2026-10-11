/**
 * Merge a GET /api/service-details response into date-keyed client state.
 *
 * The endpoint returns an ARRAY of service documents. They are keyed by
 * `date` here -- Object.keys() on the raw array yields "0", "1", "2".
 *
 * The server copy of each date wins, including its elements list: a line
 * the pastor removed must not survive in a stale tab, or the next save
 * from that tab would write it back. Worship-team picks that are still
 * being edited live in the picker's own state, not here.
 */
export function mergeServiceDetails(prev, data) {
  if (!Array.isArray(data)) return prev;
  const merged = { ...prev };
  for (const detail of data) {
    if (!detail?.date) continue;
    merged[detail.date] = { ...prev[detail.date], ...detail };
  }
  return merged;
}
