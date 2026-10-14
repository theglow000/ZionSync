import { syncSongUsageForDate, usageDateKey } from "./songUsageSync";

// In-memory stand-in for the handful of Mongo calls the sync makes
const fakeDb = (seed = {}) => {
  const data = { song_usage: [], songs: [], services: [], ...seed };
  const collection = (name) => {
    data[name] = data[name] || [];
    const docs = data[name];
    const byFilter = (q) =>
      docs.filter((d) => Object.entries(q).every(([k, v]) => d[k] === v));
    return {
      find: (q = {}) => ({
        toArray: async () => byFilter(q),
        sort: () => ({ toArray: async () => byFilter(q) }),
      }),
      findOne: async (q) => byFilter(q)[0] || null,
      insertOne: async (doc) => {
        docs.push({ ...doc });
        return { insertedId: docs.length };
      },
      updateOne: async (q, u) => {
        const doc = byFilter(q)[0];
        if (!doc) return { matchedCount: 0 };
        if (u.$push?.uses) doc.uses = [...(doc.uses || []), u.$push.uses];
        if (u.$pull?.uses) {
          const drop = u.$pull.uses.dateUsed.$in.map((d) => d.getTime());
          doc.uses = doc.uses.filter(
            (x) => !drop.includes(new Date(x.dateUsed).getTime()),
          );
        }
        Object.assign(doc, u.$set || {});
        return { matchedCount: 1 };
      },
    };
  };
  return { collection, data };
};

const use = (iso) => ({ dateUsed: new Date(iso), service: "x" });
const titlesOn = (db, key) =>
  db.data.song_usage
    .filter((d) => d.uses.some((u) => usageDateKey(u.dateUsed) === key))
    .map((d) => d.title)
    .sort();

describe("usageDateKey", () => {
  test("reads every stored time-of-day convention as the right service date", () => {
    expect(usageDateKey(new Date("2026-02-08T23:59:59.999Z"))).toBe("2/8/26");
    expect(usageDateKey(new Date("2025-11-10T05:59:59.999Z"))).toBe("11/9/25");
    expect(usageDateKey(new Date("2026-03-22T12:00:00.000Z"))).toBe("3/22/26");
  });
});

describe("syncSongUsageForDate", () => {
  test("a swapped-out song leaves that date's history; the new one joins", async () => {
    const db = fakeDb({
      song_usage: [
        {
          title: "Old Song",
          uses: [use("2026-03-15T12:00:00Z"), use("2026-01-04T12:00:00Z")],
        },
        { title: "Kept Song", uses: [use("2026-03-15T23:59:59.999Z")] },
      ],
    });
    await syncSongUsageForDate(db, "3/15/26", {
      song_0: { title: "Kept Song" },
      song_1: { title: "New Song", type: "hymn", number: "12" },
      song_2: { title: "" },
    });

    expect(titlesOn(db, "3/15/26")).toEqual(["Kept Song", "New Song"]);
    // Other dates untouched
    expect(titlesOn(db, "1/4/26")).toEqual(["Old Song"]);
    // No per-service notes copied onto the history record
    const created = db.data.song_usage.find((d) => d.title === "New Song");
    expect(created.songData.notes).toBeUndefined();
  });

  test("is idempotent: saving the same songs twice adds nothing", async () => {
    const db = fakeDb();
    const sel = { song_0: { title: "A" } };
    await syncSongUsageForDate(db, "3/15/26", sel);
    await syncSongUsageForDate(db, "3/15/26", sel);
    expect(db.data.song_usage[0].uses).toHaveLength(1);
  });

  test("matches history despite punctuation and spacing differences", async () => {
    const db = fakeDb({
      song_usage: [
        { title: "Shine, Jesus Shine", uses: [use("2026-03-15T12:00:00Z")] },
      ],
    });
    await syncSongUsageForDate(db, "3/15/26", {
      song_0: { title: "Shine, Jesus, Shine " },
    });
    expect(db.data.song_usage).toHaveLength(1);
    expect(db.data.song_usage[0].uses).toHaveLength(1);
  });

  test("clearing every song empties the date and keeps the record", async () => {
    const db = fakeDb({
      song_usage: [{ title: "A", uses: [use("2026-03-15T12:00:00Z")] }],
    });
    await syncSongUsageForDate(db, "3/15/26", {});
    expect(db.data.song_usage[0].uses).toEqual([]);
  });

  test("keeps the song database's usage count equal to its history", async () => {
    const db = fakeDb({
      songs: [{ title: "A", usageCount: 9 }],
      song_usage: [{ title: "A", uses: [use("2026-01-04T12:00:00Z")] }],
    });
    await syncSongUsageForDate(db, "3/15/26", { song_0: { title: "A" } });
    expect(db.data.songs[0].usageCount).toBe(2);
  });

  test("REGRESSION: identical duplicate entries collapse to one, never to zero", async () => {
    const db = fakeDb({
      song_usage: [
        {
          title: "A",
          uses: [use("2026-03-15T12:00:00Z"), use("2026-03-15T12:00:00Z")],
        },
      ],
    });
    await syncSongUsageForDate(db, "3/15/26", { song_0: { title: "A" } });
    expect(db.data.song_usage[0].uses).toHaveLength(1);
  });
});
