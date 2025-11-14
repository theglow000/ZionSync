// Diagnostic script that prompts for MongoDB URI
// This bypasses the environment variable requirement

import { MongoClient } from "mongodb";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function diagnoseDatabase(uri) {
  console.log("\n🔍 Connecting to MongoDB...\n");

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected successfully!\n");

    const db = client.db("church");

    // Check collections
    const collections = await db.listCollections().toArray();
    console.log(
      "📊 Collections found:",
      collections.map((c) => c.name).join(", "),
    );
    console.log("");

    // Check serviceDetails
    const serviceDetailsCount = await db
      .collection("serviceDetails")
      .countDocuments();
    console.log(`📅 serviceDetails: ${serviceDetailsCount} documents`);

    if (serviceDetailsCount > 0) {
      const sample = await db.collection("serviceDetails").findOne();
      console.log(
        "   Sample document:",
        JSON.stringify(sample, null, 2).substring(0, 200) + "...",
      );
    }
    console.log("");

    // Check serviceCalendar
    const serviceCalendarCount = await db
      .collection("serviceCalendar")
      .countDocuments();
    console.log(`📅 serviceCalendar: ${serviceCalendarCount} documents`);

    if (serviceCalendarCount > 0) {
      const sample = await db.collection("serviceCalendar").findOne();
      console.log(
        "   Sample document:",
        JSON.stringify(sample, null, 2).substring(0, 200) + "...",
      );
    }
    console.log("");

    // Check service_songs
    const serviceSongsCount = await db
      .collection("service_songs")
      .countDocuments();
    console.log(`🎵 service_songs: ${serviceSongsCount} documents`);

    if (serviceSongsCount > 0) {
      const sample = await db.collection("service_songs").findOne();
      console.log(
        "   Sample document:",
        JSON.stringify(sample, null, 2).substring(0, 200) + "...",
      );
    }
    console.log("");

    // Check songs
    const songsCount = await db.collection("songs").countDocuments();
    console.log(`🎵 songs: ${songsCount} documents`);
    console.log("");

    // Check users
    const usersCount = await db.collection("users").countDocuments();
    console.log(`👥 users: ${usersCount} documents`);
    console.log("");

    console.log("✅ Database diagnosis complete!\n");

    if (serviceDetailsCount === 0) {
      console.log("⚠️  WARNING: serviceDetails collection is EMPTY!");
      console.log("   This explains the production errors.");
      console.log("   You need to re-seed the database.\n");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.close();
  }
}

// Prompt for MongoDB URI
rl.question(
  "Enter your MongoDB URI (from Vercel environment variables): ",
  (uri) => {
    if (!uri || uri.trim() === "") {
      console.log("❌ No URI provided. Exiting.");
      rl.close();
      process.exit(1);
    }

    diagnoseDatabase(uri.trim())
      .then(() => {
        rl.close();
        process.exit(0);
      })
      .catch((error) => {
        console.error("Fatal error:", error);
        rl.close();
        process.exit(1);
      });
  },
);
