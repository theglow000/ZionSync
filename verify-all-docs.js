#!/usr/bin/env node

/**
 * Master Documentation Verification Script
 *
 * Runs all documentation verification scripts and provides a comprehensive report
 */

const { execSync } = require("child_process");
const fs = require("fs");

// Available verification scripts
const verificationScripts = [
  {
    name: "API Reference",
    script: "verify-api-docs.js",
    description: "Verifies API endpoints against documentation",
    priority: "HIGH",
  },
  {
    name: "Database Schema",
    script: "verify-database-schema.js",
    description:
      "Verifies database collections and schema against documentation",
    priority: "HIGH",
  },
  {
    name: "Component Library",
    script: "verify-component-library.js",
    description:
      "Verifies React components against component library documentation",
    priority: "HIGH",
  },
  {
    name: "Architecture Overview",
    script: "verify-architecture.js",
    description:
      "Verifies project structure against architecture documentation",
    priority: "MEDIUM",
  },
];

// Store results
const results = {
  passed: [],
  failed: [],
  errors: [],
};

/**
 * Run a verification script
 */
function runVerification(verification) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(
    `🔍 Running: ${verification.name} (${verification.priority} Priority)`,
  );
  console.log(`📝 ${verification.description}`);
  console.log(`${"=".repeat(60)}`);

  try {
    // Check if script exists
    if (!fs.existsSync(verification.script)) {
      throw new Error(`Verification script not found: ${verification.script}`);
    }

    // Run the script
    const output = execSync(`node ${verification.script}`, {
      encoding: "utf8",
      stdio: "pipe",
      timeout: 30000, // 30 second timeout
    });

    console.log(output);
    results.passed.push({
      name: verification.name,
      script: verification.script,
      priority: verification.priority,
    });

    return true;
  } catch (error) {
    console.error(`❌ FAILED: ${verification.name}`);
    console.error(`Error: ${error.message}`);

    // Show output even on failure (verification scripts exit with code 1 when discrepancies found)
    if (error.stdout) {
      console.log("\nOutput:");
      console.log(error.stdout);
    }

    results.failed.push({
      name: verification.name,
      script: verification.script,
      priority: verification.priority,
      error: error.message,
      output: error.stdout || "",
    });

    return false;
  }
}

/**
 * Generate summary report
 */
function generateSummaryReport() {
  console.log(`\n${"=".repeat(80)}`);
  console.log("📋 ZIONSYNC DOCUMENTATION VERIFICATION SUMMARY");
  console.log(`${"=".repeat(80)}`);

  console.log(`\n📊 OVERALL RESULTS:`);
  console.log(`   ✅ Passed: ${results.passed.length}`);
  console.log(`   ❌ Failed: ${results.failed.length}`);
  console.log(`   🔥 Errors: ${results.errors.length}`);
  console.log(
    `   📈 Success Rate: ${Math.round((results.passed.length / verificationScripts.length) * 100)}%`,
  );

  if (results.passed.length > 0) {
    console.log(`\n✅ PASSED VERIFICATIONS:`);
    results.passed.forEach((result) => {
      console.log(`   ✓ ${result.name} (${result.priority})`);
    });
  }

  if (results.failed.length > 0) {
    console.log(`\n❌ FAILED VERIFICATIONS:`);
    results.failed.forEach((result) => {
      console.log(`   ✗ ${result.name} (${result.priority})`);
      console.log(`     Script: ${result.script}`);
      console.log(`     Error: ${result.error}`);
    });
  }

  console.log(`\n📋 RECOMMENDATIONS:`);

  if (results.failed.length === 0) {
    console.log(
      `   🎉 All verifications passed! Your documentation is accurate and up-to-date.`,
    );
    console.log(
      `   💡 Consider running these verifications regularly as part of your CI/CD pipeline.`,
    );
  } else {
    console.log(
      `   🔧 Fix the failed verifications to ensure documentation accuracy:`,
    );

    const highPriorityFailed = results.failed.filter(
      (r) => r.priority === "HIGH",
    );
    const mediumPriorityFailed = results.failed.filter(
      (r) => r.priority === "MEDIUM",
    );

    if (highPriorityFailed.length > 0) {
      console.log(
        `   🚨 HIGH PRIORITY: ${highPriorityFailed.map((r) => r.name).join(", ")}`,
      );
    }

    if (mediumPriorityFailed.length > 0) {
      console.log(
        `   ⚠️  MEDIUM PRIORITY: ${mediumPriorityFailed.map((r) => r.name).join(", ")}`,
      );
    }

    console.log(
      `   📝 Review each failed verification output above for specific issues to address.`,
    );
  }

  console.log(`\n🛠️  AUTOMATION SUGGESTIONS:`);
  console.log(`   1. Add to package.json scripts:`);
  console.log(`      "verify-docs": "node verify-all-docs.js"`);
  console.log(`   2. Add to pre-commit hooks to catch documentation drift`);
  console.log(
    `   3. Run in CI/CD pipeline to ensure documentation stays current`,
  );
  console.log(`   4. Schedule weekly automated runs to catch gradual drift`);

  console.log(`\n📚 DOCUMENTATION HEALTH SCORE: ${getHealthScore()}/100`);
}

/**
 * Calculate documentation health score
 */
function getHealthScore() {
  const totalScripts = verificationScripts.length;
  const passedScripts = results.passed.length;
  const highPriorityFailed = results.failed.filter(
    (r) => r.priority === "HIGH",
  ).length;
  const mediumPriorityFailed = results.failed.filter(
    (r) => r.priority === "MEDIUM",
  ).length;

  let score = Math.round((passedScripts / totalScripts) * 100);

  // Penalize high priority failures more
  score -= highPriorityFailed * 20;
  score -= mediumPriorityFailed * 10;

  return Math.max(0, score);
}

/**
 * Main execution
 */
function main() {
  console.log("🚀 Starting comprehensive documentation verification...");
  console.log(
    `📋 Running ${verificationScripts.length} verification scripts...\n`,
  );

  // Run each verification
  let allPassed = true;
  verificationScripts.forEach((verification) => {
    const passed = runVerification(verification);
    if (!passed) {
      allPassed = false;
    }
  });

  // Generate summary
  generateSummaryReport();

  // Exit with appropriate code
  process.exit(allPassed ? 0 : 1);
}

// Handle command line arguments
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
ZionSync Documentation Verification Suite

Usage: node verify-all-docs.js [options]

Options:
  --help, -h     Show this help message
  --list, -l     List available verification scripts
  --only <name>  Run only the specified verification

Available verifications:
${verificationScripts.map((v) => `  - ${v.name}: ${v.description}`).join("\n")}
  `);
  process.exit(0);
}

if (process.argv.includes("--list") || process.argv.includes("-l")) {
  console.log("Available verification scripts:");
  verificationScripts.forEach((v) => {
    console.log(`  📋 ${v.name} (${v.priority})`);
    console.log(`     Script: ${v.script}`);
    console.log(`     Description: ${v.description}`);
    console.log();
  });
  process.exit(0);
}

// Handle --only flag
const onlyIndex = process.argv.findIndex((arg) => arg === "--only");
if (onlyIndex !== -1 && process.argv[onlyIndex + 1]) {
  const targetName = process.argv[onlyIndex + 1];
  const targetScript = verificationScripts.find(
    (v) =>
      v.name.toLowerCase().includes(targetName.toLowerCase()) ||
      v.script.includes(targetName),
  );

  if (targetScript) {
    console.log(`🎯 Running only: ${targetScript.name}`);
    runVerification(targetScript);
    process.exit(results.failed.length > 0 ? 1 : 0);
  } else {
    console.error(`❌ Verification not found: ${targetName}`);
    console.log("Available verifications:");
    verificationScripts.forEach((v) => console.log(`  - ${v.name}`));
    process.exit(1);
  }
}

// Run main execution
if (require.main === module) {
  main();
}

module.exports = {
  runVerification,
  generateSummaryReport,
  verificationScripts,
};
