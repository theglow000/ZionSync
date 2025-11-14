import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

// Get directory paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");

// Load environment variables from .env.local
const envPath = path.join(rootDir, ".env.local");
console.log("Loading environment from:", envPath);
console.log("File exists:", fs.existsSync(envPath));
dotenv.config({ path: envPath });

async function checkSongStructure() {
  try {
    // Get MongoDB URI directly from environment
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error("MONGODB_URI is not defined in .env.local");
      return;
    }

    console.log("MongoDB URI found in environment variables");

    // Connect directly using MongoClient
    const client = new MongoClient(uri);
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("church");

    // 1. Look at the song collections
    console.log("\n=== SONG COLLECTIONS ===");
    const collections = await db.listCollections().toArray();
    const songCollections = collections.filter(
      (c) =>
        c.name === "songs" ||
        c.name === "reference_songs" ||
        c.name.includes("song"),
    );

    console.log(
      "Song-related collections:",
      songCollections.map((c) => c.name),
    );

    // 2. Examine the main songs collection
    if (collections.find((c) => c.name === "songs")) {
      console.log("\n=== MAIN SONGS COLLECTION ===");
      const songCount = await db.collection("songs").countDocuments();
      console.log("songs collection contains", songCount, "documents");

      if (songCount > 0) {
        const sampleSong = await db.collection("songs").findOne({});
        console.log(
          "Sample song document:",
          JSON.stringify(sampleSong, null, 2),
        );
      }
    }

    // 3. Examine the reference songs collection
    if (collections.find((c) => c.name === "reference_songs")) {
      console.log("\n=== REFERENCE SONGS COLLECTION ===");
      const refSongCount = await db
        .collection("reference_songs")
        .countDocuments();
      console.log(
        "reference_songs collection contains",
        refSongCount,
        "documents",
      );

      if (refSongCount > 0) {
        const sampleRefSong = await db
          .collection("reference_songs")
          .findOne({});
        console.log(
          "Sample reference song document:",
          JSON.stringify(sampleRefSong, null, 2),
        );
      }
    }

    // 4. Look at how songs are structured in services
    console.log("\n=== SONGS IN SERVICES ===");
    const serviceWithSongs = await db
      .collection("serviceDetails")
      .findOne({ "elements.type": "song_hymn" });

    if (serviceWithSongs) {
      console.log("Found a service with songs");
      console.log("Service date:", serviceWithSongs.date);

      const songElements = serviceWithSongs.elements.filter(
        (e) => e.type === "song_hymn",
      );
      console.log(`Service has ${songElements.length} song elements`);

      if (songElements.length > 0) {
        console.log(
          "\nSample song element in service:",
          JSON.stringify(songElements[0], null, 2),
        );
      }
    } else {
      console.log("No services with songs found");
    }

    // 5. Look at the song_usage collection if it exists
    if (collections.find((c) => c.name === "song_usage")) {
      console.log("\n=== SONG USAGE TRACKING ===");
      const usageCount = await db.collection("song_usage").countDocuments();
      console.log("song_usage collection contains", usageCount, "documents");

      if (usageCount > 0) {
        const sampleUsage = await db.collection("song_usage").findOne({});
        console.log(
          "Sample song usage record:",
          JSON.stringify(sampleUsage, null, 2),
        );
      }
    }

    // 6. Check how service songs are referenced
    console.log("\n=== SERVICE SONGS REFERENCE ===");
    if (collections.find((c) => c.name === "service_songs")) {
      const serviceSongCount = await db
        .collection("service_songs")
        .countDocuments();
      console.log(
        "service_songs collection contains",
        serviceSongCount,
        "documents",
      );

      if (serviceSongCount > 0) {
        const sampleServiceSong = await db
          .collection("service_songs")
          .findOne({});
        console.log(
          "Sample service_songs document:",
          JSON.stringify(sampleServiceSong, null, 2),
        );
      }
    }

    await client.close();
    console.log("\nDatabase song structure check complete");
  } catch (error) {
    console.error("Error checking song structure:", error);
  }
}

checkSongStructure();
