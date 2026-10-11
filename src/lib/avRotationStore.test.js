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
      createIndex: async (keys, opts) => {
        data.indexes = [...(data.indexes || []), { name, keys, opts }];
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

describe("concurrent writers", () => {
  const dupKey = () => Object.assign(new Error("E11000"), { code: 11000 });

  it("enforces one epoch per effective date with a unique index", async () => {
    const db = fakeDb();
    await ensureRotationSeeded(db);
    expect(db.data.indexes).toContainEqual({
      name: "av_rotation_epochs",
      keys: { effectiveDate: 1 },
      opts: { unique: true },
    });
  });

  it("a seed that loses the insert race is a quiet no-op", async () => {
    const db = fakeDb({ av_users: [user("Ben")] });
    const real = db.collection;
    db.collection = (n) => {
      const c = real(n);
      if (n !== "av_rotation_epochs") return c;
      return {
        ...c,
        findOne: async () => null,
        updateOne: async () => {
          throw dupKey();
        },
      };
    };
    await expect(ensureRotationSeeded(db)).resolves.toBeUndefined();
    expect(db.data.av_users.find((u) => u.name === "Ben").core).toBeUndefined();
  });

  it("a change that loses the insert race updates the winner's epoch", async () => {
    const db = fakeDb({
      av_users: ["Ben", "Doug", "Jaimes", "Brett"].map((n) =>
        user(n, { core: true }),
      ),
    });
    await ensureRotationSeeded(db);
    const real = db.collection;
    let raced = false;
    db.collection = (n) => {
      const c = real(n);
      if (n !== "av_rotation_epochs") return c;
      return {
        ...c,
        updateOne: async (q, u, o = {}) => {
          if (o.upsert && !raced) {
            raced = true;
            await c.updateOne(q, { $set: { members: ["someone else"] } }, o);
            throw dupKey();
          }
          return c.updateOne(q, u, o);
        },
      };
    };
    const epochs = await recordRotationChange(db, parseServiceDate("11/4/26"));
    const next = epochs.find((e) => e.effectiveDate === "11/15/26");
    expect(next.members).not.toContain("someone else");
    expect(epochs.filter((e) => e.effectiveDate === "11/15/26")).toHaveLength(
      1,
    );
  });
});

describe("unique index is best-effort", () => {
  const failingIndex = (db) => {
    const real = db.collection;
    let calls = 0;
    db.collection = (n) => ({
      ...real(n),
      createIndex: async () => {
        calls += 1;
        throw Object.assign(new Error("E11000 building index"), {
          code: 11000,
        });
      },
    });
    return () => calls;
  };

  it("existing duplicates block the index but never the A/V tab or Core toggle", async () => {
    const db = fakeDb({
      av_users: ["Ben", "Doug", "Jaimes", "Brett"].map((n) => user(n)),
    });
    failingIndex(db);
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(ensureRotationSeeded(db)).resolves.toBeUndefined();
    const epochs = await recordRotationChange(db, parseServiceDate("11/4/26"));
    expect(epochs.map((e) => e.effectiveDate)).toContain("11/15/26");
    spy.mockRestore();
  });

  it("builds the index once per database, not on every request", async () => {
    const db = fakeDb({ av_users: [user("Ben")] });
    await ensureRotationSeeded(db);
    await ensureRotationSeeded(db);
    await recordRotationChange(db, parseServiceDate("11/4/26"));
    expect(db.data.indexes).toHaveLength(1);
  });
});
