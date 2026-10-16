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
import { MongoClient, BSON } from "mongodb";
import { syncSongUsageForDate, usageDateKey } from "../src/lib/songUsageSync";
import { normalizeTitle } from "../src/lib/songHistory";

const APPLY = process.argv.includes("--apply");
// Canonical EJSON keeps ObjectIds and Dates restorable (mongoimport/EJSON.parse)
const ejson = (x) => BSON.EJSON.stringify(x, { relaxed: false }, 1);
const clone = (x) => BSON.EJSON.parse(ejson(x), { relaxed: false });
const same = (a, b) => (a?._bsontype === "ObjectId" ? a.equals(b) : a === b);
const STALE_LINE = /^(last (sung|used)\b|not sung\b)/i;

const cleanNotes = (notes) =>
  (notes || "")
    .split("\n")
    .filter((l) => !STALE_LINE.test(l.trim()))
    .join("\n")
    .trim();

// Minimal in-memory db for the dry run: the calls the sync makes
const memoryDb = (data) => {
  const match = (d, q) => Object.entries(q).every(([k, v]) => same(d[k], v));
  return {
    collection: (name) => {
      const docs = (data[name] = data[name] || []);
      return {
        find: (q = {}) => ({
          toArray: async () => clone(docs.filter((d) => match(d, q))),
          sort: () => ({
            toArray: async () => clone(docs.filter((d) => match(d, q))),
          }),
        }),
        findOne: async (q) => clone(docs.find((d) => match(d, q)) || null),
        insertOne: async (doc) =>
          docs.push({ _id: new BSON.ObjectId(), ...clone(doc) }),
        updateOne: async (q, u) => {
          const doc = docs.find((d) => match(d, q));
          if (!doc) return;
          if (u.$pull?.uses) {
            const want = u.$pull.uses.dateUsed;
            const hit = want?.$gte
              ? (t) => t >= want.$gte && t < want.$lt
              : (t) => t.getTime() === new Date(want).getTime();
            doc.uses = doc.uses.filter((x) => !hit(new Date(x.dateUsed)));
          }
          if (u.$push?.uses) doc.uses = [...(doc.uses || []), u.$push.uses];
          Object.assign(doc, u.$set || {});
          for (const k of Object.keys(u.$unset || {})) delete doc[k];
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

  // The old reference-song import stored new Date("3/15/26"), which files as
  // the Saturday before. Those are duplicates of the Sunday pick, not real uses.
  const picksByDate = new Map(
    serviceSongs.map((s) => [
      s.date,
      new Set(
        Object.values(s.selections || {}).map((x) => normalizeTitle(x?.title)),
      ),
    ]),
  );
  const nextDayKey = (dateUsed) =>
    usageDateKey(new Date(new Date(dateUsed).getTime() + 24 * 3600000));
  const shiftedImports = usage.flatMap((d) =>
    (d.uses || [])
      .filter(
        (u) =>
          !serviceDates.has(usageDateKey(u.dateUsed)) &&
          picksByDate.get(nextDayKey(u.dateUsed))?.has(normalizeTitle(d.title)),
      )
      .map((u) => ({ doc: d, use: u })),
  );

  let db = live;
  if (!APPLY) {
    db = memoryDb({
      song_usage: clone(usage),
      songs: clone(songs),
    });
  } else {
    const dir = path.join(
      os.homedir(),
      "zionsync-backups",
      new Date().toISOString().replace(/[:.]/g, "-"),
    );
    fs.mkdirSync(dir, { recursive: true });
    for (const [name, docs] of [
      ["song_usage", usage],
      ["songs", songs],
    ]) {
      const file = path.join(dir, `${name}.json`);
      fs.writeFileSync(file, ejson(docs));
      // Refuse to write anything unless the backup restores to the same data
      if (
        ejson(
          BSON.EJSON.parse(fs.readFileSync(file, "utf8"), { relaxed: false }),
        ) !== ejson(docs)
      )
        throw new Error(
          `Backup of ${name} does not round-trip; nothing written`,
        );
    }
    console.log(
      `Backed up song_usage (${usage.length}) and songs (${songs.length}) to ${dir}`,
    );
  }

  for (const { doc, use } of shiftedImports) {
    console.log(
      `  shifted import: "${doc.title}" ${usageDateKey(use.dateUsed)} (service ${nextDayKey(use.dateUsed)})`,
    );
    await db
      .collection("song_usage")
      .updateOne(
        { _id: doc._id },
        { $pull: { uses: { dateUsed: use.dateUsed } } },
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

  const finalUsage = await db.collection("song_usage").find({}).toArray();
  const after = countUses(finalUsage);
  // Each pick's history should sit on the record spelled like the Song
  // Database's copy of that song (or like the pick, if the song isn't there)
  const dbTitle = new Map(
    songs.map((x) => [
      x.title.toLowerCase().replace(/[^a-z0-9]/g, ""),
      x.title,
    ]),
  );
  let misfiled = 0;
  for (const svc of serviceSongs)
    for (const sel of Object.values(svc.selections || {})) {
      const picked = sel?.title?.trim();
      if (!picked) continue;
      const t =
        dbTitle.get(picked.toLowerCase().replace(/[^a-z0-9]/g, "")) ?? picked;
      const ok = finalUsage.some(
        (d) =>
          d.title === t &&
          (d.uses || []).some((u) => usageDateKey(u.dateUsed) === svc.date),
      );
      if (!ok) {
        misfiled++;
        if (process.env.SHOW_MISFILED)
          console.log(
            `  misfiled: ${svc.date} ${JSON.stringify(t)} -> ${JSON.stringify(finalUsage.filter((d) => (d.uses || []).some((u) => usageDateKey(u.dateUsed) === svc.date) && d.title.toLowerCase().replace(/[^a-z0-9]/g, "") === t.toLowerCase().replace(/[^a-z0-9]/g, "")).map((d) => [d.title, d.status || "active"]))}`,
          );
      }
    }
  console.log(
    `\n${APPLY ? "APPLIED" : "DRY RUN (nothing written)"}\n` +
      `history entries: ${before} before -> ${after} after\n` +
      `entries on dates with no service record: ${orphanDates} (${shiftedImports.length} were Saturday-shifted imports, removed; the rest left alone)\n` +
      `song notes cleaned: ${staleSongs.length}\n` +
      `picks whose history isn't under the Song Database's spelling: ${misfiled}`,
  );
  await client.close();
};

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
