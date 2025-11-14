#!/usr/bin/env node

/**
 * Database Schema Verification Script for ZionSync
 *
 * Systematically verifies database schema documentation against actual API implementation
 * Following the same successful pattern used for API documentation verification
 */

const fs = require("fs");
const path = require("path");

// Configuration
const API_DIR = "./src/app/api";
const DOCS_FILE = "./GuidingDocs/database-schema.md";
const MODELS_DIR = "./src/models";
const SCRIPTS_DIR = "./src/scripts";
const LIB_DIR = "./src/lib";

// Store findings
const findings = {
  collections: new Map(),
  operations: new Map(),
  relationships: [],
  indexes: [],
  discrepancies: [],
};

/**
 * Extract database operations from a file
 */
function extractDatabaseOperations(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const operations = [];

    // Extract collection operations - updated regex to catch more patterns
    const collectionRegex = /db\.collection\(["']([^"']+)["']\)\.(\w+)\(/g;
    let match;
    while ((match = collectionRegex.exec(content)) !== null) {
      const [, collectionName, operation] = match;
      operations.push({
        collection: collectionName,
        operation: operation,
        file: path.relative(".", filePath),
        line: content.substring(0, match.index).split("\n").length,
      });

      // Track collection usage
      if (!findings.collections.has(collectionName)) {
        findings.collections.set(collectionName, {
          name: collectionName,
          operations: new Set(),
          fields: new Set(),
          files: new Set(),
          examples: [],
        });
      }

      const collection = findings.collections.get(collectionName);
      collection.operations.add(operation);
      collection.files.add(path.relative(".", filePath));
    }

    // Extract field references from various patterns
    const patterns = [
      // Object destructuring: { name, date, type } = body
      /\{\s*([^}]+)\s*\}\s*=\s*(?:body|req\.body|request)/g,
      // $set operations: $set: { field: value }
      /\$set:\s*\{\s*([^}]+)\s*\}/g,
      // Filter operations: { field: value }
      /find\(\{\s*([^}]+)\s*\}\)/g,
      // Update operations: updateOne({ filter }, { $set: { fields } })
      /updateOne\([^,]+,\s*\{\s*\$set:\s*\{\s*([^}]+)\s*\}/g,
      // Insert operations: insertOne({ fields })
      /insertOne\(\{\s*([^}]+)\s*\}\)/g,
    ];

    patterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const fieldString = match[1];
        if (fieldString) {
          // Parse field names from the matched string
          const fieldNames = fieldString
            .split(",")
            .map((field) => field.trim().split(":")[0].trim())
            .filter((field) => field && field.length > 0 && field.length < 30)
            .filter(
              (field) =>
                !["$exists", "$gte", "$lte", "$in", "$ne"].includes(field),
            );

          // Associate fields with collections mentioned in the same file
          operations.forEach((op) => {
            if (findings.collections.has(op.collection)) {
              fieldNames.forEach((fieldName) => {
                findings.collections.get(op.collection).fields.add(fieldName);
              });
            }
          });
        }
      }
    });

    return operations;
  } catch (error) {
    console.error(`Error analyzing ${filePath}:`, error.message);
    return [];
  }
}

/**
 * Analyze model files for schema definitions
 */
function analyzeModelFiles() {
  if (!fs.existsSync(MODELS_DIR)) return;

  const modelFiles = fs
    .readdirSync(MODELS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
    .map((entry) => path.join(MODELS_DIR, entry.name));

  modelFiles.forEach((filePath) => {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      const modelName = path.basename(filePath, ".js");

      // Extract schema fields (basic mongoose/object patterns)
      const schemaRegex = /(\w+):\s*\{[^}]*type:\s*(\w+)/g;
      let match;
      while ((match = schemaRegex.exec(content)) !== null) {
        const [, fieldName, fieldType] = match;

        // Associate with collection (convert model name to collection name)
        const collectionName = modelName.toLowerCase();
        if (!findings.collections.has(collectionName)) {
          findings.collections.set(collectionName, {
            name: collectionName,
            operations: new Set(),
            fields: new Set(),
            files: new Set(),
            model: filePath,
          });
        }

        findings.collections
          .get(collectionName)
          .fields.add(`${fieldName}:${fieldType}`);
      }
    } catch (error) {
      console.error(`Error analyzing model ${filePath}:`, error.message);
    }
  });
}

/**
 * Parse documentation to extract documented schema
 */
function parseSchemaDocumentation() {
  try {
    if (!fs.existsSync(DOCS_FILE)) {
      console.warn("Database schema documentation not found");
      return { collections: [], fields: new Map(), enums: new Map() };
    }

    const content = fs.readFileSync(DOCS_FILE, "utf8");
    const documented = {
      collections: [],
      fields: new Map(),
      enums: new Map(),
    };

    // Extract collection names from headers like "#### users" or "#### serviceDetails"
    const collectionRegex = /####\s+(\w+)\s*$/gm;
    let match;
    while ((match = collectionRegex.exec(content)) !== null) {
      const collectionName = match[1];
      documented.collections.push(collectionName);
      documented.fields.set(collectionName, new Set());
    }

    // Extract field definitions from JavaScript code blocks
    const codeBlockRegex = /```javascript\s*([\s\S]*?)\s*```/g;
    let currentCollection = null;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const codeBlock = match[1];

      // Find the collection this code block belongs to by looking backwards
      const beforeBlock = content.substring(0, match.index);
      const lastCollectionMatch = [
        ...beforeBlock.matchAll(/####\s+(\w+)\s*$/gm),
      ].pop();
      if (lastCollectionMatch) {
        currentCollection = lastCollectionMatch[1];
      }

      if (currentCollection && documented.fields.has(currentCollection)) {
        // Extract field definitions from the code block
        const fieldRegex = /(\w+):\s*([^,\n\r]+)/g;
        let fieldMatch;
        while ((fieldMatch = fieldRegex.exec(codeBlock)) !== null) {
          const [, fieldName, fieldType] = fieldMatch;
          documented.fields
            .get(currentCollection)
            .add(`${fieldName}:${fieldType.trim()}`);
        }

        // Extract dynamic field patterns like [`team_member_${body.position}`]: String
        const dynamicFieldRegex = /\[`([^`]+)`\]:\s*([^,\n\r]+)/g;
        let dynamicMatch;
        while ((dynamicMatch = dynamicFieldRegex.exec(codeBlock)) !== null) {
          const [, fieldPattern, fieldType] = dynamicMatch;
          documented.fields
            .get(currentCollection)
            .add(`${fieldPattern}:${fieldType.trim()}`);
        }

        // Extract spread pattern fields like [...songData]: "Mixed"
        const spreadRegex = /\[\.\.\.(\w+)\]:\s*([^,\n\r]+)/g;
        let spreadMatch;
        while ((spreadMatch = spreadRegex.exec(codeBlock)) !== null) {
          const [, spreadName, fieldType] = spreadMatch;
          documented.fields
            .get(currentCollection)
            .add(`...${spreadName}:${fieldType.trim()}`);
        }

        // Extract quoted field names like "rotationStatus.isLearning": Boolean
        const quotedFieldRegex = /"([^"]+)":\s*([^,\n\r]+)/g;
        let quotedMatch;
        while ((quotedMatch = quotedFieldRegex.exec(codeBlock)) !== null) {
          const [, fieldName, fieldType] = quotedMatch;
          console.log(
            `Found quoted field: "${fieldName}" in collection ${currentCollection}`,
          );
          documented.fields
            .get(currentCollection)
            .add(`${fieldName}:${fieldType.trim()}`);
        }
      }
    }

    // Extract enum definitions
    const enumRegex = /Enum:\s*\[([^\]]+)\]/g;
    while ((match = enumRegex.exec(content)) !== null) {
      const enumValues = match[1]
        .split(",")
        .map((v) => v.trim().replace(/['"]/g, ""));
      // Try to associate with nearby field definitions
      const beforeEnum = content.substring(0, match.index);
      const fieldMatch = [...beforeEnum.matchAll(/(\w+):\s*String.*$/gm)].pop();
      if (fieldMatch) {
        documented.enums.set(fieldMatch[1], enumValues);
      }
    }

    return documented;
  } catch (error) {
    console.error("Error parsing schema documentation:", error.message);
    return { collections: [], fields: new Map(), enums: new Map() };
  }
}

/**
 * Compare actual vs documented schema
 */
function compareSchemas(actualCollections, documentedSchema) {
  const discrepancies = [];

  // Check for undocumented collections
  for (const [collName, collection] of actualCollections) {
    if (!documentedSchema.collections.includes(collName)) {
      discrepancies.push({
        type: "UNDOCUMENTED_COLLECTION",
        collection: collName,
        operations: Array.from(collection.operations),
        files: Array.from(collection.files),
        fieldCount: collection.fields.size,
      });
    }
  }

  // Check for documented but unused collections
  documentedSchema.collections.forEach((docCollection) => {
    if (!actualCollections.has(docCollection)) {
      discrepancies.push({
        type: "UNUSED_DOCUMENTED_COLLECTION",
        collection: docCollection,
      });
    }
  });

  // Check field discrepancies for common collections
  for (const [collName, collection] of actualCollections) {
    if (documentedSchema.collections.includes(collName)) {
      const actualFields = collection.fields;
      const documentedFields =
        documentedSchema.fields.get(collName) || new Set();

      // Find fields used in code but not documented
      const undocumentedFields = [];
      for (const field of actualFields) {
        const fieldName = field.split(":")[0];
        const isDocumented = Array.from(documentedFields).some((docField) => {
          const docFieldName = docField.split(":")[0];

          // Direct match
          if (docFieldName === fieldName) return true;

          // Dynamic pattern match for team_member_${position} patterns
          if (
            docFieldName.includes("${") &&
            fieldName.includes("team_member_")
          ) {
            return true;
          }

          // Dynamic pattern match for selections.${position} patterns
          if (
            docFieldName.includes("selections.${position}") &&
            fieldName.includes("selections.")
          ) {
            return true;
          }

          // Spread pattern match for ...songData patterns
          if (docFieldName.startsWith("...") && fieldName === "songData") {
            return true;
          }

          return false;
        });
        if (!isDocumented) {
          undocumentedFields.push(fieldName);
        }
      }

      if (undocumentedFields.length > 0) {
        discrepancies.push({
          type: "UNDOCUMENTED_FIELDS",
          collection: collName,
          fields: undocumentedFields,
        });
      }
    }
  }

  return discrepancies;
}

/**
 * Find all JavaScript files recursively
 */
function findJavaScriptFiles(dir) {
  const files = [];

  if (!fs.existsSync(dir)) {
    console.warn(`Directory ${dir} does not exist`);
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...findJavaScriptFiles(fullPath));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".js") || entry.name.endsWith(".jsx"))
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Generate detailed report
 */
function generateReport() {
  console.log("🔍 DATABASE SCHEMA VERIFICATION REPORT");
  console.log("=".repeat(50));
  console.log();

  // Summary statistics
  console.log("📊 SUMMARY:");
  console.log(`   Collections discovered: ${findings.collections.size}`);
  console.log(`   Total discrepancies: ${findings.discrepancies.length}`);
  console.log();

  // Discovered collections
  console.log("🗄️  DISCOVERED COLLECTIONS:");
  Array.from(findings.collections.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([name, collection]) => {
      console.log(`   📁 ${name}`);
      console.log(
        `      Operations: ${Array.from(collection.operations).join(", ")}`,
      );
      if (collection.fields.size > 0) {
        const fieldList = Array.from(collection.fields).slice(0, 10).join(", ");
        const moreFields =
          collection.fields.size > 10
            ? ` ... (+${collection.fields.size - 10} more)`
            : "";
        console.log(`      Fields: ${fieldList}${moreFields}`);
      }
      console.log(`      Used in: ${collection.files.size} file(s)`);
      console.log();
    });

  // Discrepancies
  if (findings.discrepancies.length > 0) {
    console.log("⚠️  DISCREPANCIES FOUND:");
    findings.discrepancies.forEach((discrepancy, index) => {
      console.log(
        `   ${index + 1}. ${discrepancy.type}: ${discrepancy.collection}`,
      );

      switch (discrepancy.type) {
        case "UNDOCUMENTED_COLLECTION":
          console.log(`      Operations: ${discrepancy.operations.join(", ")}`);
          console.log(`      Files: ${discrepancy.files.join(", ")}`);
          console.log(`      Fields found: ${discrepancy.fieldCount}`);
          break;
        case "UNDOCUMENTED_FIELDS":
          console.log(`      Missing fields: ${discrepancy.fields.join(", ")}`);
          break;
      }
      console.log();
    });
  } else {
    console.log("✅ NO DISCREPANCIES FOUND!");
    console.log("   Database schema documentation is accurate and complete.");
  }

  console.log();
  console.log("📈 VERIFICATION COMPLETE");
  console.log(
    `   Status: ${findings.discrepancies.length === 0 ? "✅ PASSED" : "❌ FAILED"}`,
  );
  console.log(
    `   Accuracy: ${Math.round((1 - findings.discrepancies.length / Math.max(findings.collections.size, 1)) * 100)}%`,
  );
}

/**
 * Main execution
 */
async function main() {
  console.log("🚀 Starting Database Schema Verification...");
  console.log();

  // Step 1: Scan API files
  console.log("📂 Scanning API files...");
  const apiFiles = findJavaScriptFiles(API_DIR);
  apiFiles.forEach((file) => {
    extractDatabaseOperations(file);
  });
  console.log(`   Analyzed ${apiFiles.length} API files`);

  // Step 2: Scan script files
  console.log("📂 Scanning script files...");
  const scriptFiles = findJavaScriptFiles(SCRIPTS_DIR);
  scriptFiles.forEach((file) => {
    extractDatabaseOperations(file);
  });
  console.log(`   Analyzed ${scriptFiles.length} script files`);

  // Step 3: Scan lib files
  console.log("📂 Scanning lib files...");
  const libFiles = findJavaScriptFiles(LIB_DIR);
  libFiles.forEach((file) => {
    extractDatabaseOperations(file);
  });
  console.log(`   Analyzed ${libFiles.length} lib files`);

  // Step 4: Analyze model files
  console.log("📂 Analyzing model files...");
  analyzeModelFiles();

  // Step 5: Parse documentation
  console.log("📖 Parsing schema documentation...");
  const documentedSchema = parseSchemaDocumentation();
  console.log(
    `   Found ${documentedSchema.collections.length} documented collections`,
  );

  // Step 6: Compare schemas
  console.log("🔍 Comparing schemas...");
  findings.discrepancies = compareSchemas(
    findings.collections,
    documentedSchema,
  );

  // Step 7: Generate report
  console.log();
  generateReport();

  // Exit with appropriate code
  process.exit(findings.discrepancies.length === 0 ? 0 : 1);
}

// Run the verification
main().catch((error) => {
  console.error("❌ Verification failed:", error);
  process.exit(1);
});

module.exports = {
  extractDatabaseOperations,
  analyzeModelFiles,
  parseSchemaDocumentation,
  compareSchemas,
};
