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

async function checkDatabaseStructure() {
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

    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log(
      "Collections in database:",
      collections.map((c) => c.name),
    );

    // Check for services collections
    if (collections.find((c) => c.name === "service_details")) {
      const serviceCount = await db
        .collection("service_details")
        .countDocuments();
      console.log(
        "service_details collection contains",
        serviceCount,
        "documents",
      );

      // Get a sample service document to see its structure
      if (serviceCount > 0) {
        const sampleService = await db
          .collection("service_details")
          .findOne({});
        console.log(
          "Sample service_details document:",
          JSON.stringify(sampleService, null, 2),
        );
      }
    }

    // Check other potential service collections
    if (collections.find((c) => c.name === "service_songs")) {
      const serviceCount = await db
        .collection("service_songs")
        .countDocuments();
      console.log(
        "service_songs collection contains",
        serviceCount,
        "documents",
      );

      if (serviceCount > 0) {
        const sampleService = await db.collection("service_songs").findOne({});
        console.log(
          "Sample service_songs document:",
          JSON.stringify(sampleService, null, 2),
        );
      }
    }

    // Look for any other collections that might contain service data
    for (const collection of collections) {
      if (
        collection.name.includes("service") &&
        collection.name !== "service_details" &&
        collection.name !== "service_songs"
      ) {
        const count = await db.collection(collection.name).countDocuments();
        console.log(
          `${collection.name} collection contains ${count} documents`,
        );

        if (count > 0) {
          const sample = await db.collection(collection.name).findOne({});
          console.log(
            `Sample ${collection.name} document:`,
            JSON.stringify(sample, null, 2),
          );
        }
      }
    }

    // Check for upcoming services specifically
    console.log("\n--- Checking for upcoming services ---");
    const today = new Date();
    const formattedToday = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear() % 100}`;
    console.log("Today's date (M/D/YY):", formattedToday);

    // Check each potential service collection for upcoming services
    for (const collection of collections) {
      if (collection.name.includes("service")) {
        console.log(`\nChecking ${collection.name} for upcoming services...`);
        const docs = await db.collection(collection.name).find({}).toArray();

        // Filter for docs with date field
        const withDates = docs.filter((doc) => doc.date);
        console.log(`Found ${withDates.length} documents with date field`);

        if (withDates.length > 0) {
          console.log(
            "Date formats found:",
            withDates.map((d) => d.date).slice(0, 5),
          );

          // Try to find upcoming services by comparing string dates
          // This is imperfect but helpful for diagnosis
          const upcomingByString = withDates.filter((doc) => {
            try {
              // Very simplistic string comparison, assumes M/D/YY format
              return doc.date >= formattedToday;
            } catch (e) {
              return false;
            }
          });

          console.log(
            `Found ${upcomingByString.length} potentially upcoming services`,
          );

          if (upcomingByString.length > 0) {
            console.log(
              "First 3 upcoming services:",
              upcomingByString.slice(0, 3).map((s) => s.date),
            );
          }
        }
      }
    }

    await client.close();
  } catch (error) {
    console.error("Error checking database structure:", error);
  }
}

checkDatabaseStructure();
