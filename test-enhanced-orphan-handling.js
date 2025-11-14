/**
 * Test Enhanced Orphaned Song Handling
 *
 * This test verifies the new orphaned song detection and backup system.
 */

import { MongoClient } from "mongodb";

const uri =
  "mongodb+srv://theglow000:Urbane36$@zionsignupsheet.gt7uf.mongodb.net/?retryWrites=true&w=majority&appName=ZionSignupSheet";

async function testEnhancedOrphanHandling() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("church");

    console.log("🧪 Testing Enhanced Orphaned Song Handling");
    console.log("============================================\n");

    const testDate = "8/5/25";

    // Clean slate
    await db.collection("serviceDetails").deleteOne({ date: testDate });
    await db.collection("service_songs").deleteOne({ date: testDate });
    await db.collection("orphaned_songs").deleteMany({ date: testDate });

    // Step 1: Pastor creates service with 5 songs
    console.log("📝 Step 1: Pastor creates service with 5 songs...");

    const initialService = {
      date: testDate,
      title: "Enhanced Test Service",
      type: "communion",
      content:
        "Opening Hymn:\nGathering Song:\nHymn of the Day:\nCommunion Hymn:\nSending Song:",
      elements: [
        { id: "1", type: "song_hymn", content: "Opening Hymn:" },
        { id: "2", type: "song_hymn", content: "Gathering Song:" },
        { id: "3", type: "song_hymn", content: "Hymn of the Day:" },
        { id: "4", type: "song_hymn", content: "Communion Hymn:" },
        { id: "5", type: "song_hymn", content: "Sending Song:" },
      ],
      lastUpdated: new Date().toISOString(),
    };

    await db.collection("serviceDetails").insertOne(initialService);
    console.log("✅ Initial service with 5 song slots created");

    // Step 2: Worship team selects all 5 songs
    console.log("\n🎵 Step 2: Worship team selects all 5 songs...");

    const allFiveSongs = {
      song_0: {
        title: "Holy, Holy, Holy",
        type: "hymn",
        number: "413",
        hymnal: "cranberry",
      },
      song_1: {
        title: "Gather Us In",
        type: "hymn",
        number: "532",
        hymnal: "cranberry",
      },
      song_2: {
        title: "Be Thou My Vision",
        type: "hymn",
        number: "793",
        hymnal: "cranberry",
      },
      song_3: {
        title: "Let Us Break Bread Together",
        type: "hymn",
        number: "471",
        hymnal: "cranberry",
      },
      song_4: {
        title: "Go in Peace",
        type: "hymn",
        number: "634",
        hymnal: "cranberry",
      },
    };

    await fetch("http://localhost:3000/api/service-songs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: testDate,
        selections: allFiveSongs,
        updatedBy: "Worship Team",
      }),
    });

    console.log("✅ All 5 songs selected by worship team");

    // Step 3: Pastor reduces to 3 songs (this should trigger orphan handling)
    console.log(
      "\n📝 Step 3: Pastor reduces service to 3 songs (should trigger enhanced orphan handling)...",
    );

    const reducedService = {
      date: testDate,
      title: "Reduced Service - Enhanced Test",
      type: "communion",
      content: "Opening Hymn:\nHymn of the Day:\nSending Song:",
      elements: [
        { id: "1", type: "song_hymn", content: "Opening Hymn:" },
        { id: "2", type: "song_hymn", content: "Hymn of the Day:" },
        { id: "3", type: "song_hymn", content: "Sending Song:" },
      ],
      lastUpdated: (
        await db.collection("serviceDetails").findOne({ date: testDate })
      ).lastUpdated,
    };

    const pastorEditResponse = await fetch(
      "http://localhost:3000/api/service-details",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reducedService),
      },
    );

    if (!pastorEditResponse.ok) {
      throw new Error(`Pastor edit failed: ${pastorEditResponse.status}`);
    }

    console.log(
      "✅ Pastor edit completed - enhanced handling should have triggered",
    );

    // Step 4: Verify orphaned songs were backed up
    console.log("\n🔍 Step 4: Verifying orphaned song backup system...");

    const orphanedRecords = await db
      .collection("orphaned_songs")
      .find({ date: testDate })
      .toArray();
    console.log(`📦 Orphaned song records found: ${orphanedRecords.length}`);

    if (orphanedRecords.length > 0) {
      const latestOrphan = orphanedRecords[orphanedRecords.length - 1];
      console.log("📋 Latest orphan record:");
      console.log(`   Date: ${latestOrphan.date}`);
      console.log(`   Timestamp: ${latestOrphan.timestamp}`);
      console.log(`   Orphaned by: ${latestOrphan.orphanedBy}`);
      console.log(`   Count: ${latestOrphan.orphanedSongs.length}`);
      console.log("   Orphaned songs:");
      latestOrphan.orphanedSongs.forEach((song, index) => {
        console.log(
          `     ${index + 1}. ${song.title} (was: ${song.originalPrefix})`,
        );
      });
    }

    // Step 5: Verify service_songs collection was synced
    console.log("\n🔄 Step 5: Verifying service_songs collection sync...");

    const serviceSongs = await db
      .collection("service_songs")
      .findOne({ date: testDate });
    if (serviceSongs) {
      const validSongs = Object.entries(serviceSongs.selections).filter(
        ([k, v]) => v?.title,
      ).length;
      console.log(`📊 Songs in service_songs collection: ${validSongs}`);
      console.log(
        `🔄 Last synced: ${serviceSongs.lastSyncedWithServiceDetails || "Never"}`,
      );
      console.log(
        `❌ Orphaned songs removed: ${serviceSongs.orphanedSongsRemoved || 0}`,
      );
    }

    // Step 6: Verify service structure
    console.log("\n📋 Step 6: Verifying final service structure...");

    const finalService = await db
      .collection("serviceDetails")
      .findOne({ date: testDate });
    const finalSongs = finalService.elements.filter(
      (e) => e.type === "song_hymn" && e.selection?.title,
    );

    console.log(`📊 Final service song count: ${finalSongs.length}/3`);
    console.log("🎵 Preserved songs:");
    finalSongs.forEach((song, index) => {
      console.log(
        `   ${index + 1}. ${song.selection.title} (${song.content.split(":")[0]})`,
      );
    });

    // Check for orphan tracking in service document
    if (finalService.lastOrphanEvent) {
      console.log("\n📈 Orphan tracking in service document:");
      console.log(`   Timestamp: ${finalService.lastOrphanEvent.timestamp}`);
      console.log(`   Count: ${finalService.lastOrphanEvent.orphanCount}`);
      console.log(
        `   Titles: ${finalService.lastOrphanEvent.orphanedTitles.join(", ")}`,
      );
    }

    // Step 7: Test results
    console.log("\n📊 ENHANCED ORPHAN HANDLING TEST RESULTS:");
    console.log("==========================================");

    const tests = [
      { name: "Orphaned Songs Detected", passed: orphanedRecords.length > 0 },
      {
        name: "Backup Records Created",
        passed:
          orphanedRecords.length > 0 &&
          orphanedRecords[0].orphanedSongs.length === 2,
      },
      {
        name: "Service Songs Synced",
        passed: serviceSongs && serviceSongs.orphanedSongsRemoved === 2,
      },
      { name: "Songs Preserved Correctly", passed: finalSongs.length === 3 },
      {
        name: "Orphan Tracking Added",
        passed: finalService.lastOrphanEvent?.orphanCount === 2,
      },
      {
        name: "System Still Functional",
        passed: finalSongs.every((s) => s.selection?.title),
      },
    ];

    const passedTests = tests.filter((t) => t.passed).length;

    tests.forEach((test) => {
      console.log(
        `   ${test.passed ? "✅" : "❌"} ${test.name}: ${test.passed ? "PASSED" : "FAILED"}`,
      );
    });

    console.log(
      `\n🎯 Overall Result: ${passedTests}/${tests.length} tests passed`,
    );

    if (passedTests === tests.length) {
      console.log("🎉 SUCCESS: Enhanced orphan handling works perfectly!");
      console.log("   ✅ Orphaned songs are detected and backed up");
      console.log("   ✅ Data consistency is maintained");
      console.log("   ✅ Tracking information is preserved");
      console.log("   ✅ System remains fully functional");
    } else {
      console.log("❌ FAILURE: Enhanced orphan handling has issues");
    }

    return passedTests === tests.length;
  } catch (error) {
    console.error("❌ Enhanced orphan test failed:", error);
    return false;
  } finally {
    await client.close();
  }
}

// Run the enhanced test
testEnhancedOrphanHandling().catch(console.error);
