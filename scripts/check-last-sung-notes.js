// Read-only: compare the app's computed "Last sung" line with every
// "Last sung/used ..." note the worship leader typed by hand.
// Run: node --env-file=.env.local scripts/check-last-sung-notes.js (via node_modules/.bin/jiti)
import { MongoClient } from "mongodb";
import {
  findPreviousUse,
  describePreviousUse,
} from "../src/lib/songHistory.js";

const main = async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const docs = await client
    .db("church")
    .collection("service_songs")
    .find({})
    .toArray();
  let same = 0,
    differ = 0;
  for (const doc of docs)
    for (const sel of Object.values(doc.selections || {})) {
      const typed = (sel?.notes || "").match(/^Last (?:sung|used) (.+?)\.?$/im);
      if (!typed) continue;
      const prev = findPreviousUse(docs, sel.title, doc.date);
      const d = prev ? describePreviousUse(prev, doc.date) : null;
      const computed = d
        ? `${d.date}${d.dayName ? `, ${d.dayName}` : ""}`
        : "No earlier record";
      const ok = d && typed[1].startsWith(d.date);
      ok ? same++ : differ++;
      console.log(
        `${ok ? "SAME  " : "DIFFER"} ${doc.date} ${sel.title}\n   typed:    ${typed[1]}\n   computed: ${computed}`,
      );
    }
  console.log(`\n${same} same, ${differ} differ`);
  await client.close();
};
main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
