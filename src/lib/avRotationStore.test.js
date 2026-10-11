import {
  ensureRotationSeeded,
  recordRotationChange,
  getRotationEpochs,
} from "./avRotationStore";
import { parseServiceDate } from "./avRotation";

// Minimal in-memory stand-in for the MongoDB calls the store makes.
const matches = (doc, query) =>
  Object.entries(query).every(([k, v]) =>
    v && typeof v === "object" && "$ne" in v ? doc[k] !== v.$ne : doc[k] === v,
  );

const fakeDb = (seed = {}) => {
  const data = { av_users: [], av_rotation_epochs: [], ...seed };
  const collection = (name) => {
    data[name] = data[name] || [];
    const docs = data[name];
    return {
      find: (q = {}) => ({
        toArray: async () =>
          docs.filter((d) => matches(d, q)).map((d) => ({ ...d })),
      }),
      findOne: async (q) => docs.find((d) => matches(d, q)) || null,
      updateOne: async (q, update, opts = {}) => {
        let doc = docs.find((d) => matches(d, q));
        if (!doc) {
          if (!opts.upsert) return { upsertedCount: 0, modifiedCount: 0 };
          doc = { ...q, ...(update.$setOnInsert || {}) };
          Object.assign(doc, update.$set || {});
          docs.push(doc);
          return { upsertedCount: 1, modifiedCount: 0 };
        }
        Object.assign(doc, update.$set || {});
        return { upsertedCount: 0, modifiedCount: 1 };
      },
    };
  };
  return { collection, data };
};

const user = (name, extra = {}) => ({ name, deleted: false, ...extra });

describe("ensureRotationSeeded", () => {
  it("creates the 10/25/26 epoch, marks the five core, adds Abbey, leaves Laila a sub", async () => {
    const db = fakeDb({
      av_users: ["Ben", "Doug", "Jaimes", "Laila", "Brett"].map((n) => user(n)),
    });
    await ensureRotationSeeded(db);

    expect(db.data.av_rotation_epochs).toHaveLength(1);
    expect(db.data.av_rotation_epochs[0]).toMatchObject({
      effectiveDate: "10/25/26",
      members: ["Ben", "Doug", "Jaimes", "Brett", "Abbey"],
    });
    const core = db.data.av_users.filter((u) => u.core).map((u) => u.name);
    expect(core.sort()).toEqual(["Abbey", "Ben", "Brett", "Doug", "Jaimes"]);
    expect(db.data.av_users.find((u) => u.name === "Abbey").deleted).toBe(
      false,
    );
    expect(
      db.data.av_users.find((u) => u.name === "Laila").core,
    ).toBeUndefined();
  });

  it("runs once — a later un-core is never reverted", async () => {
    const db = fakeDb({ av_users: [user("Ben")] });
    await ensureRotationSeeded(db);
    db.data.av_users.find((u) => u.name === "Ben").core = false;
    await ensureRotationSeeded(db);

    expect(db.data.av_rotation_epochs).toHaveLength(1);
    expect(db.data.av_users.find((u) => u.name === "Ben").core).toBe(false);
  });
});

describe("recordRotationChange", () => {
  const seeded = async () => {
    const db = fakeDb({
      av_users: ["Ben", "Doug", "Jaimes", "Laila", "Brett"].map((n) => user(n)),
    });
    await ensureRotationSeeded(db);
    return db;
  };

  it("before 10/25, updates the seeded epoch in place", async () => {
    const db = await seeded();
    db.data.av_users.find((u) => u.name === "Laila").core = true;
    const epochs = await recordRotationChange(db, parseServiceDate("10/11/26"));

    expect(epochs).toHaveLength(1);
    expect(epochs[0].members).toEqual([
      "Ben",
      "Doug",
      "Jaimes",
      "Brett",
      "Abbey",
      "Laila",
    ]);
  });

  it("deleted core users drop out of the next epoch", async () => {
    const db = await seeded();
    db.data.av_users.find((u) => u.name === "Brett").deleted = true;
    const epochs = await recordRotationChange(db, parseServiceDate("11/4/26"));

    expect(epochs).toHaveLength(2);
    const next = epochs.find((e) => e.effectiveDate === "11/15/26");
    expect(next.members).not.toContain("Brett");
    expect(next.members).toHaveLength(4);
  });

  it("several changes before it takes effect collapse into one epoch", async () => {
    const db = await seeded();
    db.data.av_users.find((u) => u.name === "Laila").core = true;
    await recordRotationChange(db, parseServiceDate("11/4/26"));
    db.data.av_users.find((u) => u.name === "Laila").core = false;
    const epochs = await recordRotationChange(db, parseServiceDate("11/5/26"));

    expect(epochs).toHaveLength(2);
    expect(epochs[1].members).not.toContain("Laila");
    expect(await getRotationEpochs(db)).toHaveLength(2);
  });
});
