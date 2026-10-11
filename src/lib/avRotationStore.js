/**
 * MongoDB side of the A/V core rotation: the first-run seed and recording a new
 * epoch whenever core membership changes. Scheduling math lives in avRotation.js.
 */
import { buildNextEpoch } from "./avRotation";
import { AV_ROTATION_SEED } from "./constants";

const EPOCHS = "av_rotation_epochs";
const USERS = "av_users";

export const getRotationEpochs = (db) =>
  db.collection(EPOCHS).find({}).toArray();

// Two upserts racing on the same date can both insert unless the database
// itself forbids it. The loser gets a duplicate-key error (11000).
const isDuplicateKey = (err) => err?.code === 11000;

// The index is built once per server instance (keyed by database name; each
// request gets a fresh Db object) and is best-effort: if production already
// holds duplicate dates, building it fails, and that must not take the A/V
// tab down. A failed build is retried on the next request.
const indexBuilds = new Map();
const ensureEpochIndex = (db) => {
  const key = db.databaseName || db;
  if (!indexBuilds.has(key)) {
    indexBuilds.set(
      key,
      db
        .collection(EPOCHS)
        .createIndex({ effectiveDate: 1 }, { unique: true })
        .catch((err) => {
          indexBuilds.delete(key);
          console.error("av_rotation_epochs unique index not created:", err);
        }),
    );
  }
  return indexBuilds.get(key);
};

/**
 * Create the first rotation (10/25/26) once. Core flags are set only when this
 * call actually inserted the epoch, so un-coring someone later is never undone
 * and concurrent first loads can't double-apply.
 */
export const ensureRotationSeeded = async (db) => {
  const epochs = db.collection(EPOCHS);
  await ensureEpochIndex(db);
  if (await epochs.findOne({ effectiveDate: AV_ROTATION_SEED.effectiveDate })) {
    return;
  }

  let result;
  try {
    result = await epochs.updateOne(
      { effectiveDate: AV_ROTATION_SEED.effectiveDate },
      {
        $setOnInsert: {
          members: AV_ROTATION_SEED.members,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
  } catch (err) {
    if (isDuplicateKey(err)) return; // another first load seeded it
    throw err;
  }
  if (result.upsertedCount !== 1) return;

  for (const name of AV_ROTATION_SEED.members) {
    await db.collection(USERS).updateOne(
      { name },
      {
        $set: { core: true },
        $setOnInsert: { timestamp: new Date(), deleted: false },
      },
      { upsert: true },
    );
  }
};

/**
 * Write the epoch that reflects the current core list (upserted by its
 * effective date) and return all epochs for the client.
 */
export const recordRotationChange = async (db, today = new Date()) => {
  await ensureEpochIndex(db);
  const coreUsers = await db
    .collection(USERS)
    .find({ core: true, deleted: { $ne: true } })
    .toArray();
  const epochs = await getRotationEpochs(db);

  const next = buildNextEpoch({
    epochs,
    coreNames: coreUsers.map((u) => u.name),
    today,
  });

  const filter = { effectiveDate: next.effectiveDate };
  const set = { $set: { members: next.members, updatedAt: new Date() } };
  try {
    await db
      .collection(EPOCHS)
      .updateOne(
        filter,
        { ...set, $setOnInsert: { createdAt: new Date() } },
        { upsert: true },
      );
  } catch (err) {
    if (!isDuplicateKey(err)) throw err;
    // A concurrent change inserted this date first; overwrite it with the
    // core list as it stands now.
    await db.collection(EPOCHS).updateOne(filter, set);
  }

  return getRotationEpochs(db);
};
