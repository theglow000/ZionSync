/**
 * Debug Script: Cross-Team Data Synchronization
 *
 * This script will check what's actually in the database to understand
 * why the worship team saved songs aren't showing in presentation team.
 */

import { MongoClient } from "mongodb";

const uri =
  "mongodb+srv://theglow000:Urbane36$@zionsignupsheet.gt7uf.mongodb.net/?retryWrites=true&w=majority&appName=ZionSignupSheet";

async function debugDataSync() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("church");

    console.log("🔍 Debugging Cross-Team Data Synchronization");
    console.log("==============================================\n");

    // Check the specific dates shown in screenshots
    const dates = ["11/2/25", "11/9/25", "11/16/25"];

    for (const date of dates) {
      console.log(`📅 Checking data for ${date}:`);
      console.log("----------------------------------");

      // Check service_songs collection (where worship team saves)
      const serviceSongs = await db
        .collection("service_songs")
        .findOne({ date });
      console.log(
        `🎵 service_songs collection:`,
        serviceSongs ? "EXISTS" : "NOT FOUND",
      );
      if (serviceSongs) {
        console.log(`   Date: ${serviceSongs.date}`);
        console.log(`   Updated by: ${serviceSongs.updatedBy}`);
        console.log(`   Last updated: ${serviceSongs.lastUpdated}`);
        if (serviceSongs.selections) {
          Object.entries(serviceSongs.selections).forEach(([key, song]) => {
            if (song?.title) {
              console.log(
                `   ${key}: ${song.title}${song.number ? ` #${song.number}` : ""}${song.hymnal ? ` (${song.hymnal})` : ""}`,
              );
            }
          });
        }
      }

      // Check serviceDetails collection (where presentation team reads)
      const serviceDetails = await db
        .collection("serviceDetails")
        .findOne({ date });
      console.log(
        `📋 serviceDetails collection:`,
        serviceDetails ? "EXISTS" : "NOT FOUND",
      );
      if (serviceDetails) {
        console.log(`   Date: ${serviceDetails.date}`);
        console.log(`   Title: ${serviceDetails.title}`);
        console.log(`   Last updated: ${serviceDetails.lastUpdated}`);
        console.log(
          `   Elements count: ${serviceDetails.elements?.length || 0}`,
        );

        if (serviceDetails.elements) {
          serviceDetails.elements.forEach((element, index) => {
            if (
              element.type === "song_hymn" ||
              element.type === "song_contemporary"
            ) {
              console.log(`   Element ${index}: ${element.content}`);
              if (element.selection) {
                console.log(
                  `     Selection: ${element.selection.title}${element.selection.number ? ` #${element.selection.number}` : ""}${element.selection.hymnal ? ` (${element.selection.hymnal})` : ""}`,
                );
              } else {
                console.log(`     Selection: NONE`);
              }
            }
          });
        }
      }

      console.log("");
    }

    // Let's also check what the APIs are returning
    console.log("🔗 Testing API Endpoints:");
    console.log("-------------------------");

    try {
      const response = await fetch("http://localhost:3000/api/service-details");
      if (response.ok) {
        const data = await response.json();
        console.log(
          `✅ /api/service-details: ${data.length} services returned`,
        );

        const nov9Service = data.find((s) => s.date === "11/9/25");
        if (nov9Service) {
          console.log(`📋 Nov 9 service from API:`);
          console.log(`   Title: ${nov9Service.title}`);
          console.log(`   Elements: ${nov9Service.elements?.length || 0}`);

          nov9Service.elements?.forEach((element, index) => {
            if (element.type === "song_hymn") {
              console.log(`   Song ${index}: ${element.content}`);
              if (element.selection) {
                console.log(
                  `     API Selection: ${element.selection.title}${element.selection.number ? ` #${element.selection.number}` : ""}`,
                );
              }
            }
          });
        }
      } else {
        console.log(
          `❌ /api/service-details: ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      console.log(`❌ API Error: ${error.message}`);
    }

    // Check service-songs API
    try {
      const response = await fetch(
        "http://localhost:3000/api/service-songs?date=11/9/25",
      );
      if (response.ok) {
        const data = await response.json();
        console.log(
          `✅ /api/service-songs for 11/9/25:`,
          data ? "HAS DATA" : "NO DATA",
        );
        if (data?.selections) {
          Object.entries(data.selections).forEach(([key, song]) => {
            if (song?.title) {
              console.log(
                `   ${key}: ${song.title}${song.number ? ` #${song.number}` : ""}`,
              );
            }
          });
        }
      } else {
        console.log(
          `❌ /api/service-songs: ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      console.log(`❌ Service-songs API Error: ${error.message}`);
    }
  } catch (error) {
    console.error("❌ Debug failed:", error);
  } finally {
    await client.close();
  }
}

// Run the debug
debugDataSync().catch(console.error);
