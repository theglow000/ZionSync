#!/usr/bin/env node

/**
 * Liturgical Calendar Integration Documentation Verification Script
 *
 * Phase 4B: Verifies that liturgical-calendar-integration.md accurately
 * documents the actual implementation of liturgical calendar features.
 *
 * Following the same methodology as previous verification phases:
 * - Phase 1: API Reference (100% accuracy achieved)
 * - Phase 2A: Database Schema (89% accuracy achieved)
 * - Phase 2B: Component Library (100% accuracy achieved)
 * - Phase 2C: Architecture Overview (100% accuracy achieved)
 * - Phase 3A: Environment Setup (100% accuracy achieved)
 * - Phase 4A: Song Management System (100% accuracy achieved)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Results tracking
const results = {
  totalChecks: 0,
  passed: 0,
  failed: 0,
  issues: [],
};

function addResult(category, description, status, details = null) {
  results.totalChecks++;

  if (status === "PASS") {
    results.passed++;
  } else {
    results.failed++;
    results.issues.push({
      category,
      description,
      status,
      details,
    });
  }

  const statusIcon = status === "PASS" ? "✅" : "❌";
  console.log(`${statusIcon} ${category}: ${description}`);
  if (details && status !== "PASS") {
    console.log(`   Details: ${details}`);
  }
}

async function verifyFile(filePath, description) {
  const fullPath = path.join(__dirname, filePath);
  const exists = fs.existsSync(fullPath);

  addResult(
    "File Existence",
    description,
    exists ? "PASS" : "FAIL",
    exists ? null : `File not found: ${filePath}`,
  );

  return exists;
}

async function verifyLiturgicalCalendarService() {
  console.log("\n📅 Verifying LiturgicalCalendarService Implementation...");

  const servicePath = "src/lib/LiturgicalCalendarService.js";
  if (!(await verifyFile(servicePath, "LiturgicalCalendarService.js exists"))) {
    return;
  }

  try {
    // Import the service to check exports
    const {
      calculateEaster,
      calculateAdventStart,
      calculateAshWednesday,
      getCurrentSeason,
      getSeasonColor,
      getLiturgicalInfo,
      getSpecialDay,
      getLiturgicalInfoForService,
      getSeasonForDate,
      getNextLiturgicalSeason,
      getSeasonDateRange,
      getDaysRemainingInSeason,
      getSeasonProgressPercentage,
      clearCache,
    } = await import("./src/lib/LiturgicalCalendarService.js");

    // Verify documented functions exist
    const expectedFunctions = [
      "calculateEaster",
      "calculateAdventStart",
      "calculateAshWednesday",
      "getCurrentSeason",
      "getSeasonColor",
      "getLiturgicalInfo",
      "getSpecialDay",
      "getLiturgicalInfoForService",
      "getSeasonForDate",
      "getNextLiturgicalSeason",
      "getSeasonDateRange",
      "getDaysRemainingInSeason",
      "getSeasonProgressPercentage",
      "clearCache",
    ];

    const actualFunctions = {
      calculateEaster,
      calculateAdventStart,
      calculateAshWednesday,
      getCurrentSeason,
      getSeasonColor,
      getLiturgicalInfo,
      getSpecialDay,
      getLiturgicalInfoForService,
      getSeasonForDate,
      getNextLiturgicalSeason,
      getSeasonDateRange,
      getDaysRemainingInSeason,
      getSeasonProgressPercentage,
      clearCache,
    };

    expectedFunctions.forEach((funcName) => {
      const exists = typeof actualFunctions[funcName] === "function";
      addResult(
        "LiturgicalCalendarService",
        `Function ${funcName} exists`,
        exists ? "PASS" : "FAIL",
        exists
          ? null
          : `Function ${funcName} not exported from LiturgicalCalendarService`,
      );
    });

    // Test basic functionality
    try {
      const testDate = new Date(2024, 11, 1); // December 1, 2024 (Advent)
      const season = getCurrentSeason(testDate);
      const seasonColor = getSeasonColor(testDate);
      const liturgicalInfo = getLiturgicalInfo(testDate);

      addResult(
        "LiturgicalCalendarService",
        "getCurrentSeason returns valid season",
        season && typeof season === "string" ? "PASS" : "FAIL",
        season
          ? `Returned: ${season}`
          : "Function returned null or invalid value",
      );

      addResult(
        "LiturgicalCalendarService",
        "getSeasonColor returns valid color",
        seasonColor &&
          typeof seasonColor === "string" &&
          seasonColor.startsWith("#")
          ? "PASS"
          : "FAIL",
        seasonColor
          ? `Returned: ${seasonColor}`
          : "Function returned null or invalid color",
      );

      addResult(
        "LiturgicalCalendarService",
        "getLiturgicalInfo returns valid object",
        liturgicalInfo && typeof liturgicalInfo === "object" ? "PASS" : "FAIL",
        liturgicalInfo
          ? `Has seasonId: ${!!liturgicalInfo.seasonId}, season: ${!!liturgicalInfo.season}`
          : "Function returned null or invalid object",
      );
    } catch (error) {
      addResult(
        "LiturgicalCalendarService",
        "Basic function calls work without errors",
        "FAIL",
        `Error: ${error.message}`,
      );
    }
  } catch (error) {
    addResult(
      "LiturgicalCalendarService",
      "Module imports successfully",
      "FAIL",
      `Import error: ${error.message}`,
    );
  }
}

async function verifyLiturgicalSeasons() {
  console.log("\n🎨 Verifying LiturgicalSeasons Configuration...");

  const seasonsPath = "src/lib/LiturgicalSeasons.js";
  if (!(await verifyFile(seasonsPath, "LiturgicalSeasons.js exists"))) {
    return;
  }

  try {
    const { LITURGICAL_SEASONS, MAJOR_FEAST_DAYS } = await import(
      "./src/lib/LiturgicalSeasons.js"
    );

    // Verify documented seasons exist with correct colors
    const expectedSeasons = {
      ADVENT: "#5D3FD3",
      CHRISTMAS: "#D4AF37",
      EPIPHANY: "#008080",
      LENT: "#800020",
      HOLY_WEEK: "#8B0000",
      EASTER: "#FFF0AA",
      PENTECOST_DAY: "#FF3131",
      TRINITY: "#FFFFFF",
      ORDINARY_TIME: "#556B2F",
    };

    Object.entries(expectedSeasons).forEach(([seasonId, expectedColor]) => {
      const seasonData = LITURGICAL_SEASONS[seasonId];
      const exists = seasonData && seasonData.color === expectedColor;

      addResult(
        "LiturgicalSeasons",
        `Season ${seasonId} exists with correct color`,
        exists ? "PASS" : "FAIL",
        exists
          ? null
          : `Expected color ${expectedColor}, got ${seasonData?.color || "undefined"}`,
      );
    });

    // Verify MAJOR_FEAST_DAYS exists
    addResult(
      "LiturgicalSeasons",
      "MAJOR_FEAST_DAYS object exists",
      MAJOR_FEAST_DAYS && typeof MAJOR_FEAST_DAYS === "object"
        ? "PASS"
        : "FAIL",
      MAJOR_FEAST_DAYS
        ? `Contains ${Object.keys(MAJOR_FEAST_DAYS).length} feast days`
        : "MAJOR_FEAST_DAYS not found",
    );

    // Check for documented special days
    const expectedFeastDays = [
      "CHRISTMAS_EVE",
      "CHRISTMAS_DAY",
      "EPIPHANY_DAY",
      "ASH_WEDNESDAY",
      "PALM_SUNDAY",
    ];

    expectedFeastDays.forEach((feastDay) => {
      const exists = MAJOR_FEAST_DAYS[feastDay];
      addResult(
        "LiturgicalSeasons",
        `Feast day ${feastDay} is documented`,
        exists ? "PASS" : "FAIL",
        exists ? null : `Feast day ${feastDay} not found in MAJOR_FEAST_DAYS`,
      );
    });
  } catch (error) {
    addResult(
      "LiturgicalSeasons",
      "Module imports successfully",
      "FAIL",
      `Import error: ${error.message}`,
    );
  }
}

async function verifyLiturgicalCSS() {
  console.log("\n🎨 Verifying Liturgical CSS Classes...");

  const cssPath = "src/styles/liturgical-themes.css";
  if (!(await verifyFile(cssPath, "liturgical-themes.css exists"))) {
    return;
  }

  try {
    const cssContent = fs.readFileSync(path.join(__dirname, cssPath), "utf8");

    // Check for documented CSS class types
    const expectedClassTypes = [
      "season-border-",
      "season-bg-",
      "season-text-",
      "season-indicator-",
    ];

    expectedClassTypes.forEach((classType) => {
      const exists = cssContent.includes(classType);
      addResult(
        "Liturgical CSS",
        `CSS classes with prefix "${classType}" exist`,
        exists ? "PASS" : "FAIL",
        exists ? null : `No CSS classes found with prefix ${classType}`,
      );
    });

    // Check for specific documented seasons in CSS
    const expectedSeasons = [
      "advent",
      "christmas",
      "lent",
      "easter",
      "epiphany",
    ];

    expectedSeasons.forEach((season) => {
      const borderExists = cssContent.includes(`.season-border-${season}`);
      const bgExists = cssContent.includes(`.season-bg-${season}`);
      const textExists = cssContent.includes(`.season-text-${season}`);

      addResult(
        "Liturgical CSS",
        `Season "${season}" has complete CSS class set`,
        borderExists && bgExists && textExists ? "PASS" : "FAIL",
        `Border: ${borderExists}, Background: ${bgExists}, Text: ${textExists}`,
      );
    });

    // Check for documented header classes
    const headerClassExists = cssContent.includes("season-header-");
    addResult(
      "Liturgical CSS",
      "Season header classes exist",
      headerClassExists ? "PASS" : "FAIL",
      headerClassExists ? null : "No season-header- classes found in CSS",
    );
  } catch (error) {
    addResult(
      "Liturgical CSS",
      "CSS file reads successfully",
      "FAIL",
      `Read error: ${error.message}`,
    );
  }
}

async function verifyLiturgicalComponents() {
  console.log("\n🧩 Verifying Liturgical Components...");

  // Check LiturgicalStyling component
  const stylingExists = await verifyFile(
    "src/components/liturgical/LiturgicalStyling.jsx",
    "LiturgicalStyling.jsx component exists",
  );

  if (stylingExists) {
    try {
      const stylingContent = fs.readFileSync(
        path.join(__dirname, "src/components/liturgical/LiturgicalStyling.jsx"),
        "utf8",
      );

      // Check for documented functions
      const hasGetSeasonClass = stylingContent.includes("getSeasonClass");
      const hasGetHeaderClass = stylingContent.includes("getHeaderClass");

      addResult(
        "LiturgicalStyling",
        "getSeasonClass function exists",
        hasGetSeasonClass ? "PASS" : "FAIL",
        hasGetSeasonClass
          ? null
          : "getSeasonClass function not found in component",
      );

      addResult(
        "LiturgicalStyling",
        "getHeaderClass function exists",
        hasGetHeaderClass ? "PASS" : "FAIL",
        hasGetHeaderClass
          ? null
          : "getHeaderClass function not found in component",
      );
    } catch (error) {
      addResult(
        "LiturgicalStyling",
        "Component file reads successfully",
        "FAIL",
        `Read error: ${error.message}`,
      );
    }
  }

  // Check SeasonalPlanningGuide component
  const planningExists = await verifyFile(
    "src/components/ui/SeasonalPlanningGuide.jsx",
    "SeasonalPlanningGuide.jsx component exists",
  );

  if (planningExists) {
    try {
      const planningContent = fs.readFileSync(
        path.join(__dirname, "src/components/ui/SeasonalPlanningGuide.jsx"),
        "utf8",
      );

      // Check for documented functionality
      const hasSeasonalPlanning = planningContent.includes(
        "SeasonalPlanningGuide",
      );
      const usesCurrentSeason =
        planningContent.includes("getCurrentSeason") ||
        planningContent.includes("currentSeason");

      addResult(
        "SeasonalPlanningGuide",
        "Component is properly defined",
        hasSeasonalPlanning ? "PASS" : "FAIL",
        hasSeasonalPlanning
          ? null
          : "SeasonalPlanningGuide component not found",
      );

      addResult(
        "SeasonalPlanningGuide",
        "Component uses season detection",
        usesCurrentSeason ? "PASS" : "FAIL",
        usesCurrentSeason
          ? null
          : "No season detection usage found in component",
      );
    } catch (error) {
      addResult(
        "SeasonalPlanningGuide",
        "Component file reads successfully",
        "FAIL",
        `Read error: ${error.message}`,
      );
    }
  }
}

async function verifyAPIIntegration() {
  console.log("\n🔌 Verifying API Integration...");

  // Check upcoming-services API
  const upcomingServicesExists = await verifyFile(
    "src/app/api/upcoming-services/route.js",
    "upcoming-services API endpoint exists",
  );

  if (upcomingServicesExists) {
    try {
      const upcomingContent = fs.readFileSync(
        path.join(__dirname, "src/app/api/upcoming-services/route.js"),
        "utf8",
      );

      const usesLiturgicalService =
        upcomingContent.includes("getLiturgicalInfo") ||
        upcomingContent.includes("LiturgicalCalendarService");

      addResult(
        "API Integration",
        "upcoming-services uses liturgical service",
        usesLiturgicalService ? "PASS" : "FAIL",
        usesLiturgicalService
          ? null
          : "No liturgical service integration found in upcoming-services API",
      );
    } catch (error) {
      addResult(
        "API Integration",
        "upcoming-services API reads successfully",
        "FAIL",
        `Read error: ${error.message}`,
      );
    }
  }

  // Check service-songs API
  const serviceSongsExists = await verifyFile(
    "src/app/api/service-songs/route.js",
    "service-songs API endpoint exists",
  );

  if (serviceSongsExists) {
    try {
      const serviceSongsContent = fs.readFileSync(
        path.join(__dirname, "src/app/api/service-songs/route.js"),
        "utf8",
      );

      const usesLiturgicalService =
        serviceSongsContent.includes("getLiturgicalInfo") ||
        serviceSongsContent.includes("liturgical");

      addResult(
        "API Integration",
        "service-songs includes liturgical context",
        usesLiturgicalService ? "PASS" : "FAIL",
        usesLiturgicalService
          ? null
          : "No liturgical context found in service-songs API",
      );
    } catch (error) {
      addResult(
        "API Integration",
        "service-songs API reads successfully",
        "FAIL",
        `Read error: ${error.message}`,
      );
    }
  }
}

async function verifyMigrationScripts() {
  console.log("\n🔄 Verifying Migration Scripts...");

  // Check for documented migration scripts
  const expectedScripts = [
    "src/scripts/add-season-to-services.js",
    "src/scripts/fix-liturgical-seasons.js",
  ];

  for (const scriptPath of expectedScripts) {
    const exists = await verifyFile(
      scriptPath,
      `Migration script ${path.basename(scriptPath)} exists`,
    );

    if (exists) {
      try {
        const scriptContent = fs.readFileSync(
          path.join(__dirname, scriptPath),
          "utf8",
        );

        const usesLiturgicalService =
          scriptContent.includes("getLiturgicalInfo") ||
          scriptContent.includes("LiturgicalCalendarService");

        addResult(
          "Migration Scripts",
          `${path.basename(scriptPath)} uses liturgical service`,
          usesLiturgicalService ? "PASS" : "FAIL",
          usesLiturgicalService
            ? null
            : "Script does not import or use liturgical service",
        );
      } catch (error) {
        addResult(
          "Migration Scripts",
          `${path.basename(scriptPath)} reads successfully`,
          "FAIL",
          `Read error: ${error.message}`,
        );
      }
    }
  }
}

async function verifyCalendarDataSource() {
  console.log("\n📋 Verifying Calendar Data Source...");

  // Check for documented LCMC calendar
  const calendarExists = await verifyFile(
    "2024-2025 LCMC Liturgical Calendar.md",
    "LCMC Liturgical Calendar reference exists",
  );

  if (calendarExists) {
    try {
      const calendarContent = fs.readFileSync(
        path.join(__dirname, "2024-2025 LCMC Liturgical Calendar.md"),
        "utf8",
      );

      // Check for calendar structure
      const hasSeasonStructure =
        calendarContent.includes("Advent") &&
        calendarContent.includes("Christmas") &&
        calendarContent.includes("Epiphany");

      addResult(
        "Calendar Data Source",
        "LCMC calendar contains expected liturgical seasons",
        hasSeasonStructure ? "PASS" : "FAIL",
        hasSeasonStructure
          ? null
          : "Calendar does not contain expected liturgical season structure",
      );
    } catch (error) {
      addResult(
        "Calendar Data Source",
        "LCMC calendar reads successfully",
        "FAIL",
        `Read error: ${error.message}`,
      );
    }
  }
}

async function main() {
  console.log("🔍 ZionSync Liturgical Calendar Integration Verification");
  console.log("=".repeat(60));
  console.log("📄 Document: liturgical-calendar-integration.md (828 lines)");
  console.log("🎯 Target: 90%+ accuracy (algorithmic precision critical)");
  console.log("");

  await verifyLiturgicalCalendarService();
  await verifyLiturgicalSeasons();
  await verifyLiturgicalCSS();
  await verifyLiturgicalComponents();
  await verifyAPIIntegration();
  await verifyMigrationScripts();
  await verifyCalendarDataSource();

  // Calculate and display results
  console.log("\n" + "=".repeat(60));
  console.log("📊 VERIFICATION RESULTS");
  console.log("=".repeat(60));

  const accuracy =
    results.totalChecks > 0
      ? ((results.passed / results.totalChecks) * 100).toFixed(1)
      : 0;

  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Accuracy: ${accuracy}%`);
  console.log(`🎯 Target: 90%+`);
  console.log(`📋 Total Checks: ${results.totalChecks}`);

  if (results.failed > 0) {
    console.log("\n❌ ISSUES FOUND:");
    console.log("-".repeat(40));

    results.issues.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.category}] ${issue.description}`);
      if (issue.details) {
        console.log(`   → ${issue.details}`);
      }
    });

    console.log("\n📝 RECOMMENDATIONS:");
    console.log("-".repeat(40));
    console.log("1. Update documentation to match actual implementation");
    console.log("2. Add missing functions or components as documented");
    console.log("3. Align color codes and CSS class naming");
    console.log("4. Ensure API integration claims match actual usage");
  }

  console.log("\n🏁 Verification complete!");

  // Save results to JSON file
  const resultsData = {
    timestamp: new Date().toISOString(),
    phase: "Phase 4B",
    document: "liturgical-calendar-integration.md",
    totalChecks: results.totalChecks,
    passed: results.passed,
    failed: results.failed,
    accuracy: parseFloat(accuracy),
    target: 90,
    issues: results.issues,
  };

  fs.writeFileSync(
    path.join(__dirname, "liturgical-integration-verification-results.json"),
    JSON.stringify(resultsData, null, 2),
  );

  console.log(
    "💾 Results saved to liturgical-integration-verification-results.json",
  );

  // Exit with non-zero status if accuracy below target
  if (parseFloat(accuracy) < 90) {
    process.exit(1);
  }
}

main().catch(console.error);
