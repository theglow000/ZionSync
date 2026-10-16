/**
 * Keeps song_usage in step with what is actually picked on each service.
 *
 * song_usage used to be append-only: swapping a song out of a service never
 * removed it, so about a quarter of the history named songs that were no
 * longer on that service. Every save of a service's songs now makes that
 * date's history match its selections exactly.
 */
import { normalizeTitle } from "./songHistory";
import { escapeRegex } from "./escapeRegex";
import { updateSongRotationStatus } from "./songRotation";

const HOUR = 3600000;

/**
 * The service date ("M/D/YY") a stored dateUsed belongs to. History holds
 * several time-of-day conventions (noon UTC, 23:59 UTC, 05:59 UTC next day for
 * Central end-of-day); shifting by six hours lands all of them on the date.
 */
export const usageDateKey = (dateUsed) => {
  const d = new Date(new Date(dateUsed).getTime() - 6 * HOUR);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${String(d.getUTCFullYear()).slice(2)}`;
};

// Noon UTC: the convention the server has written since it ran on Vercel
const storedDate = (dateStr) => {
  const [m, d, y] = dateStr.split("/").map(Number);
  return new Date(Date.UTC(2000 + y, m - 1, d, 12));
};

/**
 * Matches every spelling that normalizes to `key` ("Shine, Jesus Shine" and
 * "shine jesus, shine "), so the database returns only the records a save
 * touches. Reading whole collections took several seconds per save.
 */
const SEPARATOR = "[^a-z0-9]*";
export const titlePattern = (key) => {
  // Only normalized titles (a-z, 0-9) are accepted, and the separator class
  // never matches those characters, so the pattern cannot backtrack.
  if (!/^[a-z0-9]+$/.test(key))
    throw new Error("titlePattern expects a normalized title");
  const body = key.split("").map(escapeRegex).join(SEPARATOR);
  // nosemgrep: detect-non-literal-regexp -- input validated above
  return new RegExp(`^${SEPARATOR}${body}${SEPARATOR}$`, "i");
};

// The stored-date window that usageDateKey maps to this service date
const dayWindow = (dateStr) => {
  const [m, d, y] = dateStr.split("/").map(Number);
  const start = new Date(Date.UTC(2000 + y, m - 1, d, 6));
  return { $gte: start, $lt: new Date(start.getTime() + 24 * HOUR) };
};

/**
 * The record a pick's history belongs on, when several spellings exist:
 * active over deleted/orphaned (those are frozen records), then the spelling
 * the Song Database uses (analytics look songs up by that title), then the
 * pick's own spelling.
 */
const pickTarget = (docs, sel, songDbTitles) => {
  const key = normalizeTitle(sel.title);
  const exact = sel.title.trim();
  const rank = (d) =>
    (d.status ? 4 : 0) +
    (songDbTitles.has(d.title) ? 0 : 2) +
    (d.title === exact ? 0 : 1);
  return (
    docs
      .filter((d) => normalizeTitle(d.title) === key)
      .sort((a, b) => rank(a) - rank(b))[0] || null
  );
};

export async function syncSongUsageForDate(
  db,
  dateStr,
  selections,
  { service = "", addedBy = "" } = {},
) {
  const usage = db.collection("song_usage");

  const wanted = new Map();
  for (const sel of Object.values(selections || {})) {
    const key = normalizeTitle(sel?.title);
    if (key && !wanted.has(key)) wanted.set(key, sel);
  }

  const window = dayWindow(dateStr);
  const byTitle = [...wanted.keys()].map((key) => ({
    title: titlePattern(key),
  }));
  // This date's entries (to remove) plus every record of the picked songs
  const docs = await usage
    .find({ $or: [{ "uses.dateUsed": window }, ...byTitle] })
    .toArray();
  const songDbTitles = new Set(
    byTitle.length
      ? (
          await db
            .collection("songs")
            .find({ $or: byTitle }, { projection: { title: 1 } })
            .toArray()
        ).map((x) => x.title)
      : [],
  );
  const targets = new Map(
    [...wanted].map(([key, sel]) => [key, pickTarget(docs, sel, songDbTitles)]),
  );
  const touched = new Set();
  const satisfied = new Set();

  // Only this date's entries are ever removed, with an atomic $pull, so a
  // concurrent save of another date on the same song is never overwritten.
  for (const doc of docs) {
    const onDate = (doc.uses || []).filter(
      (u) => usageDateKey(u.dateUsed) === dateStr,
    );
    if (!onDate.length) continue;
    const key = normalizeTitle(doc.title);
    const isTarget = targets.get(key)?._id === doc._id && wanted.has(key);
    if (isTarget && onDate.length === 1) {
      satisfied.add(key);
      continue;
    }
    await usage.updateOne(
      { _id: doc._id },
      { $pull: { uses: { dateUsed: window } } },
    );
    touched.add(doc.title);
  }

  for (const [key, sel] of wanted) {
    if (satisfied.has(key)) continue;
    const entry = { dateUsed: storedDate(dateStr), service, addedBy };
    const target = targets.get(key);
    if (target) {
      await usage.updateOne({ _id: target._id }, { $push: { uses: entry } });
      touched.add(target.title);
    } else {
      // Song facts only -- per-service notes stay with the service
      await usage.insertOne({
        title: sel.title.trim(),
        type: sel.type,
        songData: {
          number: sel.number,
          hymnal: sel.hymnal,
          author: sel.author,
          sheetMusic: sel.sheetMusic,
          youtube: sel.youtube,
        },
        uses: [entry],
      });
      touched.add(sel.title.trim());
    }
  }

  if (touched.size) await refreshSongStats(db, touched);
}

/** Usage count and rotation status follow the corrected history. */
export async function refreshSongStats(db, titles) {
  const keys = new Set([...titles].map(normalizeTitle).filter(Boolean));
  if (!keys.size) return;
  const byTitle = { $or: [...keys].map((k) => ({ title: titlePattern(k) })) };
  const usageDocs = (
    await db.collection("song_usage").find(byTitle).toArray()
  ).filter((d) => keys.has(normalizeTitle(d.title)));
  const songs = (await db.collection("songs").find(byTitle).toArray()).filter(
    (s) => keys.has(normalizeTitle(s.title)),
  );

  for (const song of songs) {
    const key = normalizeTitle(song.title);
    const count = usageDocs
      .filter((d) => normalizeTitle(d.title) === key)
      .reduce((n, d) => n + (d.uses?.length || 0), 0);
    await db.collection("songs").updateOne(
      { title: song.title },
      count
        ? { $set: { usageCount: count } }
        : // No history left: the rotation badge would otherwise stay frozen
          { $set: { usageCount: 0 }, $unset: { rotationStatus: "" } },
    );
  }
  for (const title of titles) {
    try {
      await updateSongRotationStatus(title, db);
    } catch {
      // Rotation status is advisory; never fail a save over it
    }
  }
}
