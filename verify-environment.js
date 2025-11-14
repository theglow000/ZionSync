#!/usr/bin/env node

/**
 * ZionSync Environment Setup Documentation Verification Script
 *
 * This script verifies that the environment-setup.md documentation accurately
 * reflects the actual project configuration, dependencies, and setup requirements.
 *
 * Verification Categories:
 * 1. Package.json Dependencies & Scripts
 * 2. Environment Variables & Configuration
 * 3. Configuration Files (Next.js, Tailwind, etc.)
 * 4. Database Connection Setup
 * 5. Development Server Configuration
 * 6. Build & Deployment Configuration
 */

const fs = require("fs");
const path = require("path");

// Color codes for console output
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

class EnvironmentVerifier {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.successes = [];
    this.projectRoot = process.cwd();
  }

  log(message, type = "info") {
    const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
    const colorMap = {
      success: colors.green,
      error: colors.red,
      warning: colors.yellow,
      info: colors.blue,
    };

    console.log(`${colorMap[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  addResult(type, message, details = null) {
    const result = { message, details, timestamp: new Date().toISOString() };

    // Initialize arrays if they don't exist
    if (!this.successes) this.successes = [];
    if (!this.warnings) this.warnings = [];
    if (!this.errors) this.errors = [];

    // Map type to correct property name
    const typeMap = {
      success: "successes",
      warning: "warnings",
      error: "errors",
    };

    const arrayName = typeMap[type] || type + "s";
    this[arrayName].push(result);
    this.log(`${type.toUpperCase()}: ${message}`, type);
    if (details) {
      this.log(`  Details: ${details}`, type);
    }
  }

  fileExists(filePath) {
    const fullPath = path.join(this.projectRoot, filePath);
    return fs.existsSync(fullPath);
  }

  readFile(filePath) {
    try {
      const fullPath = path.join(this.projectRoot, filePath);
      return fs.readFileSync(fullPath, "utf8");
    } catch (error) {
      return null;
    }
  }

  readJsonFile(filePath) {
    try {
      const content = this.readFile(filePath);
      return content ? JSON.parse(content) : null;
    } catch (error) {
      this.addResult(
        "error",
        `Failed to parse JSON file: ${filePath}`,
        error.message,
      );
      return null;
    }
  }

  // 1. Verify Package.json Dependencies & Scripts
  verifyPackageConfiguration() {
    this.log("\n🔍 Verifying Package.json Configuration...", "info");

    const packageJson = this.readJsonFile("package.json");
    if (!packageJson) {
      this.addResult("error", "package.json file not found or invalid");
      return;
    }

    // Verify project name and version
    if (packageJson.name !== "zionsync") {
      this.addResult(
        "warning",
        'Project name in package.json differs from expected "zionsync"',
        `Found: ${packageJson.name}`,
      );
    } else {
      this.addResult("success", 'Project name correctly set to "zionsync"');
    }

    // Verify essential scripts mentioned in documentation
    const requiredScripts = {
      dev: "next dev",
      build: "next build",
      start: "next start",
      lint: "next lint",
    };

    let scriptsValid = true;
    for (const [scriptName, expectedCommand] of Object.entries(
      requiredScripts,
    )) {
      if (!packageJson.scripts[scriptName]) {
        this.addResult("error", `Missing required script: ${scriptName}`);
        scriptsValid = false;
      } else if (packageJson.scripts[scriptName] !== expectedCommand) {
        this.addResult(
          "warning",
          `Script "${scriptName}" differs from expected`,
          `Expected: ${expectedCommand}, Found: ${packageJson.scripts[scriptName]}`,
        );
      } else {
        this.addResult(
          "success",
          `Script "${scriptName}" correctly configured`,
        );
      }
    }

    // Verify essential dependencies mentioned in docs
    const criticalDependencies = [
      "next",
      "react",
      "react-dom",
      "mongodb",
      "tailwindcss",
    ];

    for (const dep of criticalDependencies) {
      const hasMain = packageJson.dependencies && packageJson.dependencies[dep];
      const hasDev =
        packageJson.devDependencies && packageJson.devDependencies[dep];

      if (!hasMain && !hasDev) {
        this.addResult("error", `Critical dependency missing: ${dep}`);
      } else {
        this.addResult("success", `Critical dependency present: ${dep}`);
      }
    }

    // Verify Next.js version (documentation mentions working system)
    if (packageJson.dependencies.next) {
      const nextVersion = packageJson.dependencies.next;
      if (nextVersion.startsWith("15") || nextVersion === "latest") {
        this.addResult(
          "success",
          `Next.js version appropriate: ${nextVersion}`,
        );
      } else {
        this.addResult(
          "warning",
          `Next.js version may be outdated`,
          `Found: ${nextVersion}`,
        );
      }
    }
  }

  // 2. Verify Environment Variables & Configuration
  verifyEnvironmentConfiguration() {
    this.log("\n🔍 Verifying Environment Configuration...", "info");

    // Check for .env.local file (mentioned in documentation)
    if (!this.fileExists(".env.local")) {
      this.addResult(
        "error",
        "Required .env.local file not found",
        "Documentation states this file should contain MONGODB_URI",
      );
      return;
    }

    const envContent = this.readFile(".env.local");
    if (!envContent) {
      this.addResult("error", "Could not read .env.local file");
      return;
    }

    // Verify MONGODB_URI is present
    if (!envContent.includes("MONGODB_URI=")) {
      this.addResult(
        "error",
        "MONGODB_URI not found in .env.local",
        "Documentation requires this for database connection",
      );
    } else {
      this.addResult("success", "MONGODB_URI present in .env.local");

      // Check if it's a valid MongoDB connection string format
      const uriMatch = envContent.match(/MONGODB_URI=(.+)/);
      if (uriMatch) {
        const uri = uriMatch[1].trim();
        if (uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://")) {
          this.addResult(
            "success",
            "MONGODB_URI appears to be valid MongoDB connection string",
          );
        } else {
          this.addResult(
            "warning",
            "MONGODB_URI format may be invalid",
            "Should start with mongodb:// or mongodb+srv://",
          );
        }
      }
    }

    // Check for PROJECT_NAME (mentioned in documentation template)
    if (envContent.includes("PROJECT_NAME=")) {
      this.addResult("success", "PROJECT_NAME environment variable present");
    } else {
      // Check if PROJECT_NAME is hardcoded in Next.js config instead
      const nextConfig = this.readFile("next.config.mjs");
      if (nextConfig && nextConfig.includes("PROJECT_NAME: 'ZionSync'")) {
        this.addResult(
          "success",
          "PROJECT_NAME configured in Next.js config (hardcoded)",
        );
      } else {
        this.addResult(
          "warning",
          "PROJECT_NAME not found in .env.local or Next.js config",
          "Documentation template includes this variable",
        );
      }
    }
  }

  // 3. Verify Configuration Files
  verifyConfigurationFiles() {
    this.log("\n🔍 Verifying Configuration Files...", "info");

    const configFiles = {
      "next.config.mjs": "Next.js configuration",
      "tailwind.config.mjs": "Tailwind CSS configuration",
      "postcss.config.mjs": "PostCSS configuration",
      "jsconfig.json": "JavaScript configuration",
      "eslint.config.mjs": "ESLint configuration",
    };

    for (const [filename, description] of Object.entries(configFiles)) {
      if (this.fileExists(filename)) {
        this.addResult("success", `${description} file present: ${filename}`);
      } else {
        this.addResult("error", `Missing ${description} file: ${filename}`);
      }
    }

    // Verify Next.js configuration specifics
    const nextConfig = this.readFile("next.config.mjs");
    if (nextConfig) {
      if (nextConfig.includes("MONGODB_URI")) {
        this.addResult(
          "success",
          "Next.js config exposes MONGODB_URI to client",
        );
      } else {
        this.addResult(
          "warning",
          "Next.js config may not expose MONGODB_URI",
          "Could affect client-side environment access",
        );
      }

      if (nextConfig.includes("reactStrictMode")) {
        this.addResult(
          "success",
          "React Strict Mode enabled in Next.js config",
        );
      }
    }

    // Verify jsconfig.json for path mapping (affects imports)
    const jsconfig = this.readJsonFile("jsconfig.json");
    if (
      jsconfig &&
      jsconfig.compilerOptions &&
      jsconfig.compilerOptions.paths
    ) {
      if (jsconfig.compilerOptions.paths["@/*"]) {
        this.addResult("success", "Path mapping configured for @/* imports");
      } else {
        this.addResult("warning", "Path mapping for @/* imports not found");
      }
    }
  }

  // 4. Verify Database Connection Setup
  verifyDatabaseSetup() {
    this.log("\n🔍 Verifying Database Connection Setup...", "info");

    // Check MongoDB connection utility
    if (this.fileExists("src/lib/mongodb.js")) {
      this.addResult("success", "MongoDB connection utility found");

      const mongoLib = this.readFile("src/lib/mongodb.js");
      if (mongoLib) {
        // Verify it checks for MONGODB_URI
        if (
          mongoLib.includes("MONGODB_URI") &&
          mongoLib.includes("process.env.MONGODB_URI")
        ) {
          this.addResult(
            "success",
            "MongoDB utility properly checks for MONGODB_URI",
          );
        } else {
          this.addResult(
            "error",
            "MongoDB utility missing MONGODB_URI environment check",
          );
        }

        // Check for proper error handling
        if (
          mongoLib.includes("throw new Error") &&
          mongoLib.includes("MONGODB_URI")
        ) {
          this.addResult(
            "success",
            "MongoDB utility has proper error handling for missing URI",
          );
        } else {
          this.addResult(
            "warning",
            "MongoDB utility may lack proper error handling",
          );
        }

        // Check for connection options
        if (
          mongoLib.includes("maxPoolSize") ||
          mongoLib.includes("serverSelectionTimeoutMS")
        ) {
          this.addResult(
            "success",
            "MongoDB connection includes performance options",
          );
        }
      }
    } else {
      this.addResult(
        "error",
        "MongoDB connection utility not found at src/lib/mongodb.js",
      );
    }

    // Verify database collections mentioned in documentation
    const documentedCollections = [
      "users",
      "worship_users",
      "av_users",
      "serviceDetails",
      "signups",
      "worship_assignments",
      "songs",
      "song_usage",
      "completed",
    ];

    // Search for API endpoints that use these collections
    let collectionsFound = 0;
    const apiDir = path.join(this.projectRoot, "src/app/api");
    if (fs.existsSync(apiDir)) {
      const apiFiles = this.getAllFiles(apiDir, ".js");

      for (const collection of documentedCollections) {
        let foundInApi = false;
        for (const apiFile of apiFiles) {
          const content = this.readFile(apiFile);
          if (content && content.includes(collection)) {
            foundInApi = true;
            break;
          }
        }

        if (foundInApi) {
          collectionsFound++;
        } else {
          this.addResult(
            "warning",
            `Collection "${collection}" not found in API endpoints`,
            "May indicate unused collection or missing API implementation",
          );
        }
      }

      this.addResult(
        "success",
        `Found ${collectionsFound}/${documentedCollections.length} documented collections in API usage`,
      );
    }
  }

  // 5. Verify Development Server Configuration
  verifyDevelopmentServer() {
    this.log("\n🔍 Verifying Development Server Configuration...", "info");

    const packageJson = this.readJsonFile("package.json");
    if (packageJson && packageJson.scripts && packageJson.scripts.dev) {
      const devCommand = packageJson.scripts.dev;
      if (devCommand === "next dev") {
        this.addResult(
          "success",
          "Development server script correctly configured",
        );

        // Documentation mentions running on http://localhost:3000
        this.addResult(
          "success",
          "Development server will run on http://localhost:3000 (Next.js default)",
        );
      } else {
        this.addResult(
          "warning",
          'Development server script differs from expected "next dev"',
          `Found: ${devCommand}`,
        );
      }
    }

    // Check if Next.js configuration has custom port
    const nextConfig = this.readFile("next.config.mjs");
    if (
      nextConfig &&
      (nextConfig.includes("port:") || nextConfig.includes('"port"'))
    ) {
      this.addResult(
        "warning",
        "Next.js config specifies custom port",
        "Documentation assumes localhost:3000",
      );
    } else {
      this.addResult("success", "Next.js config uses default port (3000)");
    }
  }

  // 6. Verify Build & Deployment Configuration
  verifyDeploymentConfiguration() {
    this.log("\n🔍 Verifying Deployment Configuration...", "info");

    const packageJson = this.readJsonFile("package.json");
    if (packageJson && packageJson.scripts) {
      // Build script verification
      if (packageJson.scripts.build === "next build") {
        this.addResult(
          "success",
          "Build script correctly configured for Next.js",
        );
      } else {
        this.addResult("error", "Build script missing or incorrect");
      }

      // Start script verification (for production)
      if (packageJson.scripts.start === "next start") {
        this.addResult(
          "success",
          "Production start script correctly configured",
        );
      } else {
        this.addResult("error", "Production start script missing or incorrect");
      }
    }

    // Check for Vercel configuration (mentioned in docs)
    if (this.fileExists(".vercel")) {
      this.addResult("success", "Vercel configuration directory found");
    }

    if (this.fileExists("vercel.json")) {
      this.addResult("success", "Vercel configuration file found");
    }

    // Check Next.js configuration for production readiness
    const nextConfig = this.readFile("next.config.mjs");
    if (nextConfig) {
      if (nextConfig.includes("env:") && nextConfig.includes("MONGODB_URI")) {
        this.addResult(
          "success",
          "Next.js config properly exposes environment variables for deployment",
        );
      } else {
        this.addResult(
          "warning",
          "Next.js config may not properly expose environment variables for deployment",
        );
      }
    }
  }

  // Utility method to get all files with specific extension
  getAllFiles(dirPath, extension) {
    let files = [];
    try {
      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          files = files.concat(this.getAllFiles(fullPath, extension));
        } else if (item.endsWith(extension)) {
          files.push(
            fullPath
              .replace(this.projectRoot, "")
              .replace(/\\/g, "/")
              .substring(1),
          );
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }
    return files;
  }

  // Main verification method
  async verify() {
    this.log(
      `${colors.bold}🚀 ZionSync Environment Setup Verification${colors.reset}`,
      "info",
    );
    this.log(`📁 Project Root: ${this.projectRoot}`, "info");
    this.log(`📅 Started at: ${new Date().toISOString()}`, "info");

    try {
      this.verifyPackageConfiguration();
      this.verifyEnvironmentConfiguration();
      this.verifyConfigurationFiles();
      this.verifyDatabaseSetup();
      this.verifyDevelopmentServer();
      this.verifyDeploymentConfiguration();

      this.generateReport();
    } catch (error) {
      this.addResult("error", "Verification process failed", error.message);
      console.error("Stack trace:", error.stack);
    }
  }

  generateReport() {
    this.log(`\n${colors.bold}📋 VERIFICATION REPORT${colors.reset}`, "info");
    this.log("=".repeat(50), "info");

    const total =
      this.successes.length + this.warnings.length + this.errors.length;
    const successRate =
      total > 0 ? Math.round((this.successes.length / total) * 100) : 0;

    this.log(`✅ Successes: ${this.successes.length}`, "success");
    this.log(`⚠️  Warnings: ${this.warnings.length}`, "warning");
    this.log(`❌ Errors: ${this.errors.length}`, "error");
    this.log(
      `📊 Success Rate: ${successRate}%`,
      successRate >= 90 ? "success" : successRate >= 70 ? "warning" : "error",
    );

    if (this.errors.length > 0) {
      this.log(
        `\n${colors.bold}❌ ERRORS REQUIRING ATTENTION:${colors.reset}`,
        "error",
      );
      this.errors.forEach((error, index) => {
        this.log(`${index + 1}. ${error.message}`, "error");
        if (error.details) {
          this.log(`   ${error.details}`, "error");
        }
      });
    }

    if (this.warnings.length > 0) {
      this.log(
        `\n${colors.bold}⚠️  WARNINGS (Documentation Discrepancies):${colors.reset}`,
        "warning",
      );
      this.warnings.forEach((warning, index) => {
        this.log(`${index + 1}. ${warning.message}`, "warning");
        if (warning.details) {
          this.log(`   ${warning.details}`, "warning");
        }
      });
    }

    // Save results to JSON file
    const results = {
      timestamp: new Date().toISOString(),
      summary: {
        total,
        successes: this.successes.length,
        warnings: this.warnings.length,
        errors: this.errors.length,
        successRate,
      },
      successes: this.successes,
      warnings: this.warnings,
      errors: this.errors,
    };

    try {
      fs.writeFileSync(
        path.join(this.projectRoot, "environment-verification-results.json"),
        JSON.stringify(results, null, 2),
      );
      this.log(
        `\n📄 Detailed results saved to: environment-verification-results.json`,
        "info",
      );
    } catch (error) {
      this.log(`\n❌ Failed to save results file: ${error.message}`, "error");
    }

    // Final assessment
    this.log(`\n${colors.bold}🎯 FINAL ASSESSMENT:${colors.reset}`, "info");
    if (this.errors.length === 0 && this.warnings.length <= 2) {
      this.log("✅ ENVIRONMENT DOCUMENTATION IS HIGHLY ACCURATE", "success");
      this.log(
        "   Documentation correctly reflects the actual project setup.",
        "success",
      );
    } else if (this.errors.length <= 2 && successRate >= 80) {
      this.log("⚠️  ENVIRONMENT DOCUMENTATION NEEDS MINOR UPDATES", "warning");
      this.log(
        "   A few discrepancies found between docs and implementation.",
        "warning",
      );
    } else {
      this.log(
        "❌ ENVIRONMENT DOCUMENTATION NEEDS SIGNIFICANT UPDATES",
        "error",
      );
      this.log(
        "   Multiple discrepancies found. Documentation should be revised.",
        "error",
      );
    }

    this.log(
      `\n📈 Environment Documentation Accuracy: ${successRate}%`,
      "info",
    );
    this.log(
      `🔍 Verification completed at: ${new Date().toISOString()}`,
      "info",
    );
  }
}

// Run verification if this script is executed directly
if (require.main === module) {
  const verifier = new EnvironmentVerifier();
  verifier.verify().catch((error) => {
    console.error("Verification failed:", error);
    process.exit(1);
  });
}

module.exports = EnvironmentVerifier;
