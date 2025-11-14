// Save this as src/scripts/analyze-song-usage.js
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Get directory paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");

// Load environment variables
dotenv.config({ path: path.join(rootDir, ".env.local") });

async function analyzeSongUsage() {
  console.log("Analyzing song usage for new installation...");

  try {
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db("church");

    // Get basic counts
    const songs = await db.collection("songs").find({}).toArray();
    const usage = await db.collection("song_usage").find({}).toArray();
    console.log(`\nLibrary Status:`);
    console.log(`Total songs in library: ${songs.length}`);
    console.log(`Total usage records: ${usage.length}`);

    // Analyze usage by month (since it's a new installation)
    const usageByMonth = {};
    usage.forEach((u) => {
      let useDate;
      if (u.dateUsed) {
        // Handle M/D/YY format
        const [month, day, year] = u.dateUsed.split("/");
        useDate = `${month}/${year}`;
      } else if (u.timestamp) {
        const date = new Date(u.timestamp);
        useDate = `${date.getMonth() + 1}/${date.getFullYear() % 100}`;
      }

      if (useDate) {
        if (!usageByMonth[useDate]) {
          usageByMonth[useDate] = new Set();
        }
        usageByMonth[useDate].add(u.title);
      }
    });

    console.log("\nSong usage by month:");
    Object.entries(usageByMonth)
      .sort((a, b) => {
        const [aMonth, aYear] = a[0].split("/").map(Number);
        const [bMonth, bYear] = b[0].split("/").map(Number);
        return bYear - aYear || bMonth - aMonth;
      })
      .forEach(([month, songs]) => {
        console.log(`${month}: ${songs.size} unique songs used`);
      });

    // Analyze type distribution
    const typeCount = {
      hymn: 0,
      contemporary: 0,
      unspecified: 0,
    };

    songs.forEach((song) => {
      if (song.type === "hymn") typeCount.hymn++;
      else if (song.type === "contemporary") typeCount.contemporary++;
      else typeCount.unspecified++;
    });

    console.log("\nSong type distribution:");
    console.log(`Hymns: ${typeCount.hymn}`);
    console.log(`Contemporary: ${typeCount.contemporary}`);
    console.log(`Unspecified: ${typeCount.unspecified}`);

    // Check recent additions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSongs = songs.filter((s) => {
      const created = new Date(s.created);
      return created > thirtyDaysAgo;
    });

    console.log("\nRecent additions (last 30 days):");
    recentSongs.forEach((song) => {
      console.log(`- ${song.title} (${song.type})`);
    });

    await client.close();
  } catch (error) {
    console.error("Error analyzing song usage:", error);
  }
}

analyzeSongUsage();
