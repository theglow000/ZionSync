/**
 * The subset of Mongo query matching the song-history code uses, for the
 * in-memory stand-ins (tests and the repair dry run): equality, $or, dotted
 * paths through arrays, RegExp values and $gte/$lt ranges.
 */
const valuesAt = (doc, path) =>
  path.split(".").reduce(
    (vals, key) =>
      vals.flatMap((v) => {
        const next = v?.[key];
        return Array.isArray(next) ? next : next === undefined ? [] : [next];
      }),
    [doc],
  );

const sameValue = (a, b) =>
  a?._bsontype === "ObjectId" ? a.equals(b) : a === b;

const valueMatches = (v, want) => {
  if (want instanceof RegExp) return typeof v === "string" && want.test(v);
  if (want && typeof want === "object" && ("$gte" in want || "$lt" in want)) {
    const t = new Date(v).getTime();
    return (
      (!("$gte" in want) || t >= new Date(want.$gte).getTime()) &&
      (!("$lt" in want) || t < new Date(want.$lt).getTime())
    );
  }
  if (want instanceof Date) return new Date(v).getTime() === want.getTime();
  return sameValue(v, want);
};

export const matchesQuery = (doc, query = {}) =>
  Object.entries(query).every(([key, want]) =>
    key === "$or"
      ? want.some((q) => matchesQuery(doc, q))
      : valuesAt(doc, key).some((v) => valueMatches(v, want)),
  );
