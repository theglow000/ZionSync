/**
 * Keeps song_usage in step with what is actually picked on each service.
 *
 * song_usage used to be append-only: swapping a song out of a service never
 * removed it, so about a quarter of the history named songs that were no
 * longer on that service. Every save of a service's songs now makes that
 * date's history match its selections exactly.
 */
import { normalizeTitle } from "./songHistory";
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

  const docs = await usage.find({}).toArray();
  const touched = new Set();
  const satisfied = new Set();

  for (const doc of docs) {
    const key = normalizeTitle(doc.title);
    const uses = doc.uses || [];
    const onDate = uses.filter((u) => usageDateKey(u.dateUsed) === dateStr);
    if (!onDate.length) continue;

    // Keep exactly one use for a picked song; none for a swapped-out one.
    // Rewritten as a whole list: duplicates can share an identical
    // timestamp, so removing "by value" would drop the keeper too.
    const keep = wanted.has(key) && !satisfied.has(key) ? onDate[0] : null;
    if (keep) satisfied.add(key);
    if (keep && onDate.length === 1) continue;

    await usage.updateOne(
      { _id: doc._id, title: doc.title },
      {
        $set: {
          uses: uses.filter(
            (u) => u === keep || usageDateKey(u.dateUsed) !== dateStr,
          ),
        },
      },
    );
    touched.add(doc.title);
  }

  for (const [key, sel] of wanted) {
    if (satisfied.has(key)) continue;
    const entry = { dateUsed: storedDate(dateStr), service, addedBy };
    const existing = docs.find((d) => normalizeTitle(d.title) === key);
    if (existing) {
      await usage.updateOne(
        { title: existing.title },
        { $push: { uses: entry } },
      );
      touched.add(existing.title);
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
async function refreshSongStats(db, titles) {
  const keys = new Set([...titles].map(normalizeTitle));
  const usageDocs = (
    await db.collection("song_usage").find({}).toArray()
  ).filter((d) => keys.has(normalizeTitle(d.title)));
  const songs = (await db.collection("songs").find({}).toArray()).filter((s) =>
    keys.has(normalizeTitle(s.title)),
  );

  for (const song of songs) {
    const key = normalizeTitle(song.title);
    const count = usageDocs
      .filter((d) => normalizeTitle(d.title) === key)
      .reduce((n, d) => n + (d.uses?.length || 0), 0);
    await db
      .collection("songs")
      .updateOne({ title: song.title }, { $set: { usageCount: count } });
  }
  for (const title of titles) {
    try {
      await updateSongRotationStatus(title, db);
    } catch {
      // Rotation status is advisory; never fail a save over it
    }
  }
}
