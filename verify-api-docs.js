#!/usr/bin/env node

/**
 * API Documentation Verification Script
 *
 * This script systematically verifies that the API documentation matches
 * the actual implementation by parsing all route files and comparing
 * against the documented endpoints.
 */

const fs = require("fs");
const path = require("path");

// Configuration
const API_DIR = "./src/app/api";
const DOCS_FILE = "./GuidingDocs/api-reference.md";

// Store findings
const findings = {
  endpoints: [],
  discrepancies: [],
  collections: new Set(),
  httpMethods: new Set(),
};

/**
 * Extract endpoint information from a route file
 */
function analyzeRouteFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const relativePath = path.relative(API_DIR, filePath);
    // Convert file path to actual endpoint path (remove route.js, handle dynamic routes)
    let endpointPath =
      "/api/" +
      relativePath
        .replace(/route\.js$/, "")
        .replace(/\\/g, "/")
        .replace(/\/$/, "");

    // Handle dynamic routes like [id]
    endpointPath = endpointPath.replace(/\[([^\]]+)\]/g, "{$1}");

    const endpoint = {
      path: endpointPath,
      file: filePath,
      methods: [],
      collections: [],
      requestFields: [],
      responseFields: [],
      queryParams: [],
    };

    // Extract HTTP methods
    const methodRegex =
      /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)/g;
    let match;
    while ((match = methodRegex.exec(content)) !== null) {
      endpoint.methods.push(match[1]);
      findings.httpMethods.add(match[1]);
    }

    // Extract database collections
    const collectionRegex = /\.collection\("([^"]+)"\)/g;
    while ((match = collectionRegex.exec(content)) !== null) {
      endpoint.collections.push(match[1]);
      findings.collections.add(match[1]);
    }

    // Extract request body fields (basic extraction)
    const bodyFieldRegex = /body\.(\w+)/g;
    while ((match = bodyFieldRegex.exec(content)) !== null) {
      if (!endpoint.requestFields.includes(match[1])) {
        endpoint.requestFields.push(match[1]);
      }
    }

    // Extract query parameters
    const queryRegex = /searchParams\.get\("([^"]+)"\)/g;
    while ((match = queryRegex.exec(content)) !== null) {
      endpoint.queryParams.push(match[1]);
    }

    findings.endpoints.push(endpoint);
  } catch (error) {
    console.error(`Error analyzing ${filePath}:`, error.message);
  }
}

/**
 * Recursively find all route.js files
 */
function findRouteFiles(dir) {
  const files = [];

  function walkDir(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.name === "route.js") {
        files.push(fullPath);
      }
    }
  }

  walkDir(dir);
  return files;
}

/**
 * Parse documentation to extract documented endpoints
 */
function parseDocumentation() {
  try {
    const content = fs.readFileSync(DOCS_FILE, "utf8");
    const documented = [];

    // Extract endpoint paths from markdown headers - handle both formats
    const endpointRegex =
      /####\s+(GET|POST|PUT|DELETE|PATCH)\s+(\/api\/[^\s\n]+)/g;
    let match;
    while ((match = endpointRegex.exec(content)) !== null) {
      let path = match[2];
      // Convert doc format {id} to match our endpoint format
      path = path.replace(/\{([^}]+)\}/g, "{$1}");

      documented.push({
        method: match[1],
        path: path,
      });
    }

    return documented;
  } catch (error) {
    console.error("Error parsing documentation:", error.message);
    return [];
  }
}

/**
 * Compare implementation against documentation
 */
function compareEndpoints(actualEndpoints, documentedEndpoints) {
  const discrepancies = [];

  // Create lookup maps
  const actualMap = new Map();
  actualEndpoints.forEach((ep) => {
    ep.methods.forEach((method) => {
      const key = `${method} ${ep.path}`;
      actualMap.set(key, ep);
    });
  });

  const docMap = new Map();
  documentedEndpoints.forEach((ep) => {
    const key = `${ep.method} ${ep.path}`;
    docMap.set(key, ep);
  });

  // Find undocumented endpoints
  for (const [key, endpoint] of actualMap) {
    if (!docMap.has(key)) {
      discrepancies.push({
        type: "UNDOCUMENTED",
        endpoint: key,
        details: endpoint,
      });
    }
  }

  // Find documented but non-existent endpoints
  for (const [key, endpoint] of docMap) {
    if (!actualMap.has(key)) {
      discrepancies.push({
        type: "NOT_IMPLEMENTED",
        endpoint: key,
        details: endpoint,
      });
    }
  }

  return discrepancies;
}

/**
 * Generate detailed report
 */
function generateReport() {
  console.log("=".repeat(60));
  console.log("ZionSync API Documentation Verification Report");
  console.log("=".repeat(60));
  console.log();

  console.log(`📊 SUMMARY:`);
  console.log(`   Endpoints found: ${findings.endpoints.length}`);
  console.log(
    `   HTTP methods: ${Array.from(findings.httpMethods).join(", ")}`,
  );
  console.log(`   Database collections: ${findings.collections.size}`);
  console.log(`   Discrepancies found: ${findings.discrepancies.length}`);
  console.log();

  if (findings.discrepancies.length > 0) {
    console.log("⚠️  DISCREPANCIES:");
    findings.discrepancies.forEach((disc) => {
      console.log(`   ${disc.type}: ${disc.endpoint}`);
    });
    console.log();
  }

  console.log("📋 ALL ENDPOINTS:");
  findings.endpoints.forEach((ep) => {
    console.log(`   ${ep.methods.join("|")} ${ep.path}`);
    if (ep.collections.length > 0) {
      console.log(`      Collections: ${ep.collections.join(", ")}`);
    }
    if (ep.queryParams.length > 0) {
      console.log(`      Query params: ${ep.queryParams.join(", ")}`);
    }
  });
  console.log();

  console.log("🗄️  DATABASE COLLECTIONS:");
  Array.from(findings.collections)
    .sort()
    .forEach((collection) => {
      console.log(`   - ${collection}`);
    });
}

/**
 * Main execution
 */
function main() {
  console.log("Starting API documentation verification...\n");

  // Find and analyze all route files
  const routeFiles = findRouteFiles(API_DIR);
  console.log(`Found ${routeFiles.length} route files`);

  routeFiles.forEach(analyzeRouteFile);

  // Parse documentation
  const documentedEndpoints = parseDocumentation();
  console.log(`Found ${documentedEndpoints.length} documented endpoints`);

  // Compare
  findings.discrepancies = compareEndpoints(
    findings.endpoints,
    documentedEndpoints,
  );

  // Generate report
  generateReport();

  // Exit with appropriate code
  process.exit(findings.discrepancies.length > 0 ? 1 : 0);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  analyzeRouteFile,
  findRouteFiles,
  parseDocumentation,
  compareEndpoints,
};
