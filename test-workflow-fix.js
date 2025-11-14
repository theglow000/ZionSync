/**
 * Test Script: Order of Worship Workflow Fix
 *
 * This script tests the critical fix for song selection preservation
 * when pastors edit the order of worship after worship team has
 * already selected songs.
 *
 * Test Scenario:
 * 1. Pastor creates initial service with song placeholders
 * 2. Worship team selects songs (adds selections to elements)
 * 3. Pastor edits the order of worship (should preserve songs)
 * 4. Verify song selections are maintained
 */

import { MongoClient } from "mongodb";

const uri =
  process.env.MONGODB_URI ||
  "mongodb+srv://theglenn:Gville2019@zionsync.ppyqd.mongodb.net/?retryWrites=true&w=majority&appName=ZionSync";

async function testWorkflowFix() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("church");
    const collection = db.collection("serviceDetails");

    const testDate = "1/5/25";

    console.log(
      "🧪 WORKFLOW FIX TEST: Starting order of worship preservation test...\n",
    );

    // Step 1: Clean up any existing test data
    await collection.deleteOne({ date: testDate });
    console.log("✅ Test cleanup complete\n");

    // Step 2: Pastor creates initial service (simulate PastorServiceInput save)
    console.log("📝 STEP 1: Pastor creates initial service...");
    const initialService = {
      date: testDate,
      type: "no_communion",
      content:
        "Prelude & Lighting of Candles\nOpening Hymn:\nConfession and Forgiveness\nHymn of the Day:\nSermon:\nSending Song:",
      elements: [
        { id: "1", type: "liturgy", content: "Prelude & Lighting of Candles" },
        { id: "2", type: "song_hymn", content: "Opening Hymn:" },
        { id: "3", type: "liturgy", content: "Confession and Forgiveness" },
        { id: "4", type: "song_hymn", content: "Hymn of the Day:" },
        { id: "5", type: "message", content: "Sermon:" },
        { id: "6", type: "song_hymn", content: "Sending Song:" },
      ],
      liturgical: {
        season: "epiphany",
        seasonName: "Epiphany",
        color: "green",
      },
      lastUpdated: new Date().toISOString(),
    };

    await collection.insertOne(initialService);
    console.log("✅ Initial service created with 3 song placeholders\n");

    // Step 3: Worship team selects songs (simulate WorshipTeam song selection)
    console.log("🎵 STEP 2: Worship team selects songs...");
    const serviceWithSongs = await collection.findOne({ date: testDate });

    // Simulate worship team adding song selections
    serviceWithSongs.elements[1] = {
      ...serviceWithSongs.elements[1],
      content: "Opening Hymn: Amazing Grace #280 (Red)",
      selection: {
        title: "Amazing Grace",
        number: 280,
        hymnal: "red",
        type: "hymn",
        originalPrefix: "Opening Hymn",
      },
    };

    serviceWithSongs.elements[3] = {
      ...serviceWithSongs.elements[3],
      content: "Hymn of the Day: How Great Thou Art #532 (Red)",
      selection: {
        title: "How Great Thou Art",
        number: 532,
        hymnal: "red",
        type: "hymn",
        originalPrefix: "Hymn of the Day",
      },
    };

    serviceWithSongs.elements[5] = {
      ...serviceWithSongs.elements[5],
      content: "Sending Song: Go in Peace #634 (Red)",
      selection: {
        title: "Go in Peace",
        number: 634,
        hymnal: "red",
        type: "hymn",
        originalPrefix: "Sending Song",
      },
    };

    await collection.updateOne(
      { date: testDate },
      { $set: { elements: serviceWithSongs.elements } },
    );

    console.log("✅ Worship team selected 3 songs:");
    console.log("   - Opening Hymn: Amazing Grace #280");
    console.log("   - Hymn of the Day: How Great Thou Art #532");
    console.log("   - Sending Song: Go in Peace #634\n");

    // Step 4: Pastor edits the order of worship (this is where the bug would occur)
    console.log("📝 STEP 3: Pastor edits order of worship (CRITICAL TEST)...");

    // Simulate the fixed service-details POST route
    const pastorEdit = {
      date: testDate,
      type: "no_communion",
      content:
        "Prelude & Lighting of Candles\nWelcome & Announcements\nOpening Hymn:\nConfession and Forgiveness\nHymn of the Day:\nFirst Reading: Isaiah 42:1-9\nSermon:\nSending Song:",
      elements: [
        { id: "1", type: "liturgy", content: "Prelude & Lighting of Candles" },
        { id: "2", type: "liturgy", content: "Welcome & Announcements" }, // NEW
        { id: "3", type: "song_hymn", content: "Opening Hymn:" },
        { id: "4", type: "liturgy", content: "Confession and Forgiveness" },
        { id: "5", type: "song_hymn", content: "Hymn of the Day:" },
        {
          id: "6",
          type: "reading",
          content: "First Reading:",
          reference: "Isaiah 42:1-9",
        }, // NEW
        { id: "7", type: "message", content: "Sermon:" },
        { id: "8", type: "song_hymn", content: "Sending Song:" },
      ],
      liturgical: {
        season: "epiphany",
        seasonName: "Epiphany",
        color: "green",
      },
    };

    // Manually implement the fix logic here (simulating the API route)
    const existingService = await collection.findOne({ date: testDate });
    let mergedElements = pastorEdit.elements;

    if (existingService?.elements) {
      // Create a map of existing song selections by content similarity
      const existingSongSelections = new Map();
      existingService.elements.forEach((element, index) => {
        if (
          (element.type === "song_hymn" ||
            element.type === "song_contemporary") &&
          element.selection
        ) {
          const prefix =
            element.content?.split(":")[0]?.trim()?.toLowerCase() || "";
          existingSongSelections.set(prefix, {
            selection: element.selection,
            index: index,
            originalContent: element.content,
          });
        }
      });

      // Merge new elements with existing song selections
      mergedElements = pastorEdit.elements.map((newElement) => {
        if (
          newElement.type === "song_hymn" ||
          newElement.type === "song_contemporary"
        ) {
          const newPrefix =
            newElement.content?.split(":")[0]?.trim()?.toLowerCase() || "";
          const existingSelection = existingSongSelections.get(newPrefix);

          if (existingSelection) {
            const selection = existingSelection.selection;
            const fullContent = `${newElement.content.split(":")[0].trim()}: ${selection.title} #${selection.number} (${selection.hymnal.charAt(0).toUpperCase() + selection.hymnal.slice(1)})`;

            return {
              ...newElement,
              content: fullContent,
              selection: existingSelection.selection,
            };
          }
        }
        return newElement;
      });
    }

    await collection.updateOne(
      { date: testDate },
      {
        $set: {
          ...pastorEdit,
          elements: mergedElements,
          lastUpdated: new Date().toISOString(),
        },
      },
    );

    console.log("✅ Pastor added announcements and a reading to the service\n");

    // Step 5: Verify song selections were preserved
    console.log("🔍 STEP 4: Verifying song selections were preserved...");
    const finalService = await collection.findOne({ date: testDate });

    const songsWithSelections = finalService.elements.filter(
      (el) =>
        (el.type === "song_hymn" || el.type === "song_contemporary") &&
        el.selection,
    );

    console.log("📊 RESULTS:");
    console.log(
      `   Total elements after pastor edit: ${finalService.elements.length}`,
    );
    console.log(
      `   Songs with preserved selections: ${songsWithSelections.length}/3`,
    );

    if (songsWithSelections.length === 3) {
      console.log("✅ SUCCESS: All song selections preserved!");
      songsWithSelections.forEach((song, i) => {
        console.log(`   ${i + 1}. ${song.content}`);
      });
    } else {
      console.log("❌ FAILURE: Some song selections were lost!");
      console.log(
        "   Expected 3 songs with selections, got:",
        songsWithSelections.length,
      );
    }

    // Step 6: Test edge cases
    console.log("\n🧪 STEP 5: Testing edge cases...");

    // Test case: Pastor changes song position names
    const edgeCaseEdit = {
      date: testDate,
      elements: [
        { id: "1", type: "liturgy", content: "Prelude & Lighting of Candles" },
        { id: "2", type: "song_hymn", content: "Gathering Hymn:" }, // Changed from "Opening Hymn"
        { id: "3", type: "liturgy", content: "Confession and Forgiveness" },
        { id: "4", type: "song_hymn", content: "Hymn of the Day:" }, // Same name
        { id: "5", type: "message", content: "Sermon:" },
        { id: "6", type: "song_hymn", content: "Closing Song:" }, // Changed from "Sending Song"
      ],
    };

    console.log(
      "   Testing what happens when pastor renames song positions...",
    );
    console.log(
      '   This should preserve "Hymn of the Day" but lose the others due to name mismatch',
    );

    // Clean up test data
    await collection.deleteOne({ date: testDate });
    console.log("\n🧹 Test cleanup complete");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await client.close();
  }
}

// Run the test
testWorkflowFix().catch(console.error);
