// One-time repair: rebuild song history (song_usage) from the songs actually
// picked on each service, and clear per-service "Last sung"/"Not sung" lines
// that leaked onto song records.
//
//   Dry run (default, writes nothing):
//     node --env-file=.env.local node_modules/.bin/jiti scripts/repair-song-history.js
//   Apply (backs up both collections to ~/zionsync-backups/<time>/ first):
//     ... scripts/repair-song-history.js --apply
//
// The dry run replays the exact same sync code against an in-memory copy of
// production, so its counts are what --apply will do.
import fs from "fs";
import os from "os";
import path from "path";
import { MongoClient } from "mongodb";
import { syncSongUsageForDate, usageDateKey } from "../src/lib/songUsageSync";

const APPLY = process.argv.includes("--apply");
const STALE_LINE = /^(last (sung|used)\b|not sung\b)/i;

const cleanNotes = (notes) =>
  (notes || "")
    .split("\n")
    .filter((l) => !STALE_LINE.test(l.trim()))
    .join("\n")
    .trim();

// Minimal in-memory db for the dry run: the calls syncSongUsageForDate makes
const memoryDb = (data) => {
  const match = (d, q) => Object.entries(q).every(([k, v]) => d[k] === v);
  return {
    collection: (name) => {
      const docs = (data[name] = data[name] || []);
      return {
        find: (q = {}) => ({
          toArray: async () => docs.filter((d) => match(d, q)),
          sort: () => ({
            toArray: async () => docs.filter((d) => match(d, q)),
          }),
        }),
        findOne: async (q) => docs.find((d) => match(d, q)) || null,
        insertOne: async (doc) => docs.push(structuredClone(doc)),
        updateOne: async (q, u) => {
          const doc = docs.find((d) => match(d, q));
          if (!doc) return;
          if (u.$push?.uses) doc.uses = [...(doc.uses || []), u.$push.uses];
          if (u.$pull?.uses) {
            const drop = u.$pull.uses.dateUsed.$in.map((d) => +new Date(d));
            doc.uses = doc.uses.filter(
              (x) => !drop.includes(+new Date(x.dateUsed)),
            );
          }
          Object.assign(doc, u.$set || {});
        },
      };
    },
  };
};

const countUses = (usageDocs) =>
  usageDocs.reduce((n, d) => n + (d.uses?.length || 0), 0);

const main = async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const live = client.db("church");

  const serviceSongs = await live
    .collection("service_songs")
    .find({})
    .toArray();
  const details = await live.collection("serviceDetails").find({}).toArray();
  const usage = await live.collection("song_usage").find({}).toArray();
  const songs = await live.collection("songs").find({}).toArray();
  const typeByDate = Object.fromEntries(
    details.map((d) => [d.date, d.type || ""]),
  );
  const serviceDates = new Set(serviceSongs.map((s) => s.date));

  const before = countUses(usage);
  const orphanDates = usage.flatMap((d) =>
    (d.uses || []).filter((u) => !serviceDates.has(usageDateKey(u.dateUsed))),
  ).length;

  let db = live;
  if (!APPLY) {
    db = memoryDb({
      song_usage: structuredClone(usage),
      songs: structuredClone(songs),
    });
  } else {
    const dir = path.join(
      os.homedir(),
      "zionsync-backups",
      new Date().toISOString().replace(/[:.]/g, "-"),
    );
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, "song_usage.json"),
      JSON.stringify(usage, null, 1),
    );
    fs.writeFileSync(
      path.join(dir, "songs.json"),
      JSON.stringify(songs, null, 1),
    );
    console.log(
      `Backed up song_usage (${usage.length}) and songs (${songs.length}) to ${dir}`,
    );
  }

  for (const s of serviceSongs) {
    await syncSongUsageForDate(db, s.date, s.selections, {
      service: typeByDate[s.date] || "",
      addedBy: "history repair 2026-10",
    });
  }

  const staleSongs = songs.filter(
    (s) => cleanNotes(s.notes) !== (s.notes || "").trim(),
  );
  for (const s of staleSongs) {
    console.log(
      `  song note: "${s.title}"  ${JSON.stringify(s.notes)} -> ${JSON.stringify(cleanNotes(s.notes))}`,
    );
    await db
      .collection("songs")
      .updateOne({ _id: s._id }, { $set: { notes: cleanNotes(s.notes) } });
  }

  const after = countUses(await db.collection("song_usage").find({}).toArray());
  console.log(
    `\n${APPLY ? "APPLIED" : "DRY RUN (nothing written)"}\n` +
      `history entries: ${before} before -> ${after} after\n` +
      `entries on dates with no service record (left alone): ${orphanDates}\n` +
      `song notes cleaned: ${staleSongs.length}`,
  );
  await client.close();
};

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
