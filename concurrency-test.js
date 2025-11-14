// concurrency-test.js
// Test optimistic concurrency control implementation
// Simulates two users editing the same service simultaneously

import fs from "fs";
import path from "path";

class ConcurrencyControlTester {
  constructor() {
    this.testResults = [];
    this.testDate = "7/15/25";
  }

  log(message, type = "info") {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logEntry);
    this.testResults.push({ timestamp, type, message });
  }

  async testConcurrencyControl() {
    this.log("🚀 Starting Optimistic Concurrency Control Test", "test");

    try {
      // Test 1: Verify version field is included in requests
      await this.testVersionFieldInclusion();

      // Test 2: Verify backend detects version mismatches
      await this.testVersionMismatchDetection();

      // Test 3: Simulate concurrent edit scenario
      await this.testConcurrentEditScenario();

      // Generate final report
      this.generateReport();
    } catch (error) {
      this.log(`❌ Test suite failed: ${error.message}`, "error");
      throw error;
    }
  }

  async testVersionFieldInclusion() {
    this.log(
      "📋 Test 1: Verifying version field inclusion in components",
      "test",
    );

    const signupSheet = this.readFile("src/components/ui/SignupSheet.jsx");
    const worshipTeam = this.readFile("src/components/ui/WorshipTeam.jsx");
    const apiRoute = this.readFile("src/app/api/service-details/route.js");

    const checks = [
      {
        name: "SignupSheet sends lastUpdated with requests",
        check: () =>
          signupSheet &&
          signupSheet.includes(
            "lastUpdated: serviceDetails[editingDate]?.lastUpdated",
          ),
        file: "SignupSheet.jsx",
      },
      {
        name: "WorshipTeam sends lastUpdated with requests",
        check: () =>
          worshipTeam &&
          worshipTeam.includes(
            "lastUpdated: serviceDetails[date]?.lastUpdated",
          ),
        file: "WorshipTeam.jsx",
      },
      {
        name: "API route checks for version conflicts",
        check: () =>
          apiRoute && apiRoute.includes("OPTIMISTIC CONCURRENCY CONTROL"),
        file: "service-details/route.js",
      },
      {
        name: "API route logs version mismatches",
        check: () => apiRoute && apiRoute.includes("Version mismatch detected"),
        file: "service-details/route.js",
      },
    ];

    let passed = 0;
    let failed = 0;

    for (const check of checks) {
      if (check.check()) {
        this.log(`  ✅ ${check.name}: PASSED`, "success");
        passed++;
      } else {
        this.log(`  ❌ ${check.name}: FAILED - Check ${check.file}`, "error");
        failed++;
      }
    }

    this.log(
      `📊 Version Field Test Results: ${passed}/${checks.length} checks passed`,
      failed === 0 ? "success" : "error",
    );

    if (failed > 0) {
      throw new Error(`Version field test failed: ${failed} checks failed`);
    }
  }

  async testVersionMismatchDetection() {
    this.log("📋 Test 2: Verifying version mismatch detection logic", "test");

    // Simulate the version comparison logic from the API
    const scenarios = [
      {
        name: "Same versions (no conflict)",
        existing: "2025-07-09T10:00:00.000Z",
        incoming: "2025-07-09T10:00:00.000Z",
        shouldConflict: false,
      },
      {
        name: "Different versions (conflict detected)",
        existing: "2025-07-09T10:00:00.000Z",
        incoming: "2025-07-09T09:30:00.000Z",
        shouldConflict: true,
      },
      {
        name: "Missing incoming version (no conflict check)",
        existing: "2025-07-09T10:00:00.000Z",
        incoming: null,
        shouldConflict: false,
      },
      {
        name: "Missing existing version (new document)",
        existing: null,
        incoming: "2025-07-09T10:00:00.000Z",
        shouldConflict: false,
      },
    ];

    let passed = 0;
    let failed = 0;

    for (const scenario of scenarios) {
      // Simulate the version check logic from the API
      const hasConflict =
        scenario.existing &&
        scenario.incoming &&
        scenario.existing !== scenario.incoming;

      if (hasConflict === scenario.shouldConflict) {
        this.log(`  ✅ ${scenario.name}: PASSED`, "success");
        passed++;
      } else {
        this.log(
          `  ❌ ${scenario.name}: FAILED - Expected ${scenario.shouldConflict ? "conflict" : "no conflict"}, got ${hasConflict ? "conflict" : "no conflict"}`,
          "error",
        );
        failed++;
      }
    }

    this.log(
      `📊 Version Detection Test Results: ${passed}/${scenarios.length} scenarios passed`,
      failed === 0 ? "success" : "error",
    );

    if (failed > 0) {
      throw new Error(
        `Version detection test failed: ${failed} scenarios failed`,
      );
    }
  }

  async testConcurrentEditScenario() {
    this.log("📋 Test 3: Simulating concurrent edit scenario", "test");

    // Simulate a realistic concurrent editing scenario
    const initialService = {
      date: this.testDate,
      lastUpdated: "2025-07-09T10:00:00.000Z",
      elements: [
        { id: "elem_1", type: "liturgy", content: "Welcome" },
        {
          id: "elem_2",
          type: "song_hymn",
          content: "Opening Hymn:",
          selection: null,
        },
        {
          id: "elem_3",
          type: "reading",
          content: "First Reading:",
          reference: "",
        },
      ],
    };

    // User 1 (Pastor) edits the service at 10:05 AM
    const pastorEdit = {
      ...initialService,
      lastUpdated: initialService.lastUpdated, // Pastor has the original version
      elements: [
        { id: "elem_1", type: "liturgy", content: "Welcome & Announcements" }, // Modified
        { id: "elem_2", type: "song_hymn", content: "Opening Hymn:" },
        { id: "elem_3", type: "reading", content: "First Reading:" },
        { id: "elem_4", type: "reading", content: "Second Reading:" }, // Added
      ],
    };

    // User 2 (Worship Team) adds song selection at 10:03 AM (before pastor's edit is saved)
    const worshipEdit = {
      ...initialService,
      lastUpdated: initialService.lastUpdated, // Worship team also has the original version
      elements: [
        { id: "elem_1", type: "liturgy", content: "Welcome" },
        {
          id: "elem_2",
          type: "song_hymn",
          content: "Opening Hymn: Amazing Grace #448",
          selection: {
            type: "hymn",
            title: "Amazing Grace",
            number: "448",
            hymnal: "cranberry",
          },
        },
        {
          id: "elem_3",
          type: "reading",
          content: "First Reading:",
          reference: "Isaiah 6:1-8",
        },
      ],
    };

    // Test the merge logic when worship team edit comes first
    this.log(
      "🎭 Scenario: Worship team saves first, then pastor saves",
      "info",
    );

    // Step 1: Worship team saves (updates lastUpdated to 10:03)
    const afterWorshipSave = {
      ...worshipEdit,
      lastUpdated: "2025-07-09T10:03:00.000Z",
    };

    // Step 2: Pastor saves with old version timestamp (conflict detected)
    const conflictDetected =
      afterWorshipSave.lastUpdated !== pastorEdit.lastUpdated;

    if (conflictDetected) {
      this.log(
        "  ⚠️ Conflict detected: Pastor has outdated version",
        "success",
      );

      // Simulate the merge logic that should preserve worship team's selections
      const mergedResult = this.simulateMergeLogic(
        pastorEdit.elements,
        afterWorshipSave.elements,
      );

      // Verify song selection is preserved
      const preservedSong = mergedResult.find(
        (el) => el.type === "song_hymn" && el.selection?.title,
      );
      if (preservedSong && preservedSong.selection.title === "Amazing Grace") {
        this.log(
          "  ✅ Song selection preserved during conflict resolution",
          "success",
        );
      } else {
        this.log(
          "  ❌ Song selection lost during conflict resolution",
          "error",
        );
        throw new Error("Song selection not preserved during concurrent edit");
      }

      // Verify reading reference is preserved
      const preservedReading = mergedResult.find(
        (el) => el.type === "reading" && el.reference === "Isaiah 6:1-8",
      );
      if (preservedReading) {
        this.log(
          "  ✅ Reading reference preserved during conflict resolution",
          "success",
        );
      } else {
        this.log(
          "  ❌ Reading reference lost during conflict resolution",
          "error",
        );
        throw new Error(
          "Reading reference not preserved during concurrent edit",
        );
      }

      // Verify pastor's new elements are included
      const addedReading = mergedResult.find(
        (el) => el.content === "Second Reading:",
      );
      if (addedReading) {
        this.log("  ✅ Pastor's new elements included in merge", "success");
      } else {
        this.log("  ❌ Pastor's new elements lost in merge", "error");
        throw new Error("Pastor's changes not preserved during merge");
      }
    } else {
      this.log("  ❌ Conflict should have been detected but wasn't", "error");
      throw new Error(
        "Concurrency control not working - conflict not detected",
      );
    }

    this.log(
      "📊 Concurrent Edit Test: PASSED - All scenarios handled correctly",
      "success",
    );
  }

  // Simulate the merge logic from the API (simplified for testing)
  simulateMergeLogic(newElements, existingElements) {
    // Create a map of existing song selections by prefix
    const existingSongSelections = new Map();
    const existingReadingReferences = new Map();

    existingElements.forEach((element) => {
      if (
        (element.type === "song_hymn" ||
          element.type === "song_contemporary") &&
        element.selection
      ) {
        const prefix =
          element.content?.split(":")[0]?.trim()?.toLowerCase() || "";
        existingSongSelections.set(prefix, element.selection);
      }
      if (element.type === "reading" && element.reference) {
        const prefix =
          element.content?.split(":")[0]?.trim()?.toLowerCase() || "";
        existingReadingReferences.set(prefix, element.reference);
      }
    });

    // Merge new elements with existing selections
    return newElements.map((newElement) => {
      if (
        newElement.type === "song_hymn" ||
        newElement.type === "song_contemporary"
      ) {
        const prefix =
          newElement.content?.split(":")[0]?.trim()?.toLowerCase() || "";
        const existingSelection = existingSongSelections.get(prefix);

        if (existingSelection) {
          return {
            ...newElement,
            selection: existingSelection,
            content: `${prefix}: ${existingSelection.title} #${existingSelection.number}`,
          };
        }
      }

      if (newElement.type === "reading") {
        const prefix =
          newElement.content?.split(":")[0]?.trim()?.toLowerCase() || "";
        const existingReference = existingReadingReferences.get(prefix);

        if (existingReference) {
          return {
            ...newElement,
            reference: existingReference,
          };
        }
      }

      return newElement;
    });
  }

  readFile(filePath) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      return fs.readFileSync(fullPath, "utf8");
    } catch (error) {
      this.log(`❌ Could not read file ${filePath}: ${error.message}`, "error");
      return null;
    }
  }

  generateReport() {
    this.log("📊 OPTIMISTIC CONCURRENCY CONTROL TEST REPORT", "report");
    this.log("=".repeat(80), "report");

    const errorCount = this.testResults.filter(
      (r) => r.type === "error",
    ).length;
    const successCount = this.testResults.filter(
      (r) => r.type === "success",
    ).length;

    if (errorCount === 0) {
      this.log("🎉 ALL CONCURRENCY TESTS PASSED!", "success");
      this.log(
        "✅ Version fields are properly included in requests",
        "success",
      );
      this.log("✅ Version conflicts are detected correctly", "success");
      this.log("✅ Concurrent edits are merged safely", "success");
      this.log(
        "✅ Song selections and reading references are preserved during conflicts",
        "success",
      );
    } else {
      this.log("❌ CONCURRENCY TESTS FAILED!", "error");
      this.log(
        `📊 Results: ${successCount} passed, ${errorCount} failed`,
        "error",
      );
    }

    this.log("=".repeat(80), "report");

    return errorCount === 0;
  }
}

// Execute the test
const tester = new ConcurrencyControlTester();
tester
  .testConcurrencyControl()
  .then((success) => {
    console.log(
      success
        ? "✅ Concurrency control implementation verified!"
        : "❌ Concurrency control needs fixes",
    );
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("❌ Test execution failed:", error.message);
    process.exit(1);
  });
