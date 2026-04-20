/**
 * Deactivate Ascension Thursday 5/14/26
 *
 * Marks the May 14, 2026 Ascension service as inactive so it no longer
 * appears on the Presentation, Worship, or AV tabs.
 *
 * This church will not be holding a Thursday Ascension service in 2026.
 *
 * Usage: node src/scripts/remove-ascension-2026.js
 */

import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, "../../.env.local");
dotenv.config({ path: envPath });

const TARGET_YEAR = 2026;
const TARGET_DATE_STRING = "5/14/26"; // Ascension Thursday 2026

async function deactivateAscension2026() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI is not defined in .env.local");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB\n");

    const db = client.db("church");
    const serviceCalendarCollection = db.collection("serviceCalendar");

    // Find the 2026 calendar
    const calendar = await serviceCalendarCollection.findOne({
      year: TARGET_YEAR,
    });

    if (!calendar) {
      console.error(
        `❌ No service calendar found for year ${TARGET_YEAR}. Have you generated services for 2026?`,
      );
      process.exit(1);
    }

    console.log(`📅 Found calendar for ${TARGET_YEAR}`);

    // Find the Ascension service
    const serviceIndex = calendar.services.findIndex(
      (s) => s.dateString === TARGET_DATE_STRING,
    );

    if (serviceIndex === -1) {
      console.error(
        `❌ Service with dateString "${TARGET_DATE_STRING}" not found in ${TARGET_YEAR} calendar.`,
      );
      console.log(
        "\nAvailable special weekday services in 2026:",
        calendar.services
          .filter((s) => s.isSpecialWeekday)
          .map((s) => `${s.dateString} (${s.specialDay})`)
          .join(", "),
      );
      process.exit(1);
    }

    const service = calendar.services[serviceIndex];
    console.log(
      `\nFound service: ${service.dateString} — ${service.specialDayName || service.specialDay}`,
    );
    console.log(`  Day of week: ${service.dayOfWeek}`);
    console.log(`  Season: ${service.seasonName}`);
    console.log(`  Currently active: ${service.isActive !== false}`);

    if (service.isOverridden && service.isActive === false) {
      console.log("\n⚠️  This service is already inactive. No changes needed.");
      process.exit(0);
    }

    // Build the update path key for the specific array element
    const updateKey = `services.${serviceIndex}`;

    const result = await serviceCalendarCollection.updateOne(
      { year: TARGET_YEAR },
      {
        $set: {
          [`${updateKey}.isOverridden`]: true,
          [`${updateKey}.isActive`]: false,
          [`${updateKey}.overrideReason`]:
            "Church will not hold Ascension Thursday service in 2026",
          [`${updateKey}.overriddenBy`]: "admin-script",
          [`${updateKey}.overriddenAt`]: new Date(),
        },
      },
    );

    if (result.modifiedCount === 1) {
      console.log(
        `\n✅ Successfully deactivated Ascension service on ${TARGET_DATE_STRING}`,
      );
      console.log(
        "   The service will no longer appear on the Presentation, Worship, or AV tabs.",
      );
      console.log(
        "   To re-enable it, use the Service Calendar Manager admin panel.",
      );
    } else {
      console.error("\n❌ Failed to update service — no documents modified.");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

deactivateAscension2026();
