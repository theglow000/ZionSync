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

/**
 * Create the first rotation (10/25/26) once. Core flags are set only when this
 * call actually inserted the epoch, so un-coring someone later is never undone
 * and concurrent first loads can't double-apply.
 */
export const ensureRotationSeeded = async (db) => {
  const epochs = db.collection(EPOCHS);
  if (await epochs.findOne({ effectiveDate: AV_ROTATION_SEED.effectiveDate })) {
    return;
  }

  const result = await epochs.updateOne(
    { effectiveDate: AV_ROTATION_SEED.effectiveDate },
    {
      $setOnInsert: {
        members: AV_ROTATION_SEED.members,
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );
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

  await db.collection(EPOCHS).updateOne(
    { effectiveDate: next.effectiveDate },
    {
      $set: { members: next.members, updatedAt: new Date() },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true },
  );

  return getRotationEpochs(db);
};
