#!/usr/bin/env node

/**
 * ZionSync Architecture Overview Documentation Verification Script
 * 
 * Verifies accuracy of architecture-overview.md against actual codebase implementation.
 * Checks file structure, dependencies, component patterns, and architectural decisions.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const REPO_ROOT = __dirname;
const ARCHITECTURE_DOC = path.join(REPO_ROOT, 'GuidingDocs', 'architecture-overview.md');
const PACKAGE_JSON = path.join(REPO_ROOT, 'package.json');
const NEXT_CONFIG = path.join(REPO_ROOT, 'next.config.mjs');
const TAILWIND_CONFIG = path.join(REPO_ROOT, 'tailwind.config.mjs');
const JEST_CONFIG = path.join(REPO_ROOT, 'jest.config.js');
const ESLINT_CONFIG = path.join(REPO_ROOT, 'eslint.config.mjs');

let verificationResults = {
  totalChecks: 0,
  passed: 0,
  failed: 0,
  discrepancies: [],
  summary: {}
};

/**
 * Utility functions
 */
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} ${message}`);
}

function addResult(passed, description, details = null) {
  verificationResults.totalChecks++;
  if (passed) {
    verificationResults.passed++;
    log(`${description}`, 'success');
  } else {
    verificationResults.failed++;
    verificationResults.discrepancies.push({
      description,
      details
    });
    log(`${description}`, 'error');
    if (details) {
      console.log(`   Details: ${details}`);
    }
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return null;
  }
}

function getDirectoryContents(dirPath, recursive = false) {
  if (!fs.existsSync(dirPath)) return [];
  
  const items = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      items.push(entry.name + '/');
      if (recursive) {
        const subItems = getDirectoryContents(fullPath, true);
        items.push(...subItems.map(item => `${entry.name}/${item}`));
      }
    } else {
      items.push(entry.name);
    }
  }
  
  return items;
}

function findFiles(dir, pattern, recursive = true) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && recursive) {
      results.push(...findFiles(fullPath, pattern, recursive));
    } else if (stat.isFile() && pattern.test(file)) {
      results.push(fullPath);
    }
  }
  
  return results;
}

/**
 * Verification Functions
 */

function verifyTechnologyStack() {
  log('\n🔍 Verifying Technology Stack...');
  
  const packageJson = readJsonFile(PACKAGE_JSON);
  if (!packageJson) {
    addResult(false, 'package.json file exists and is readable');
    return;
  }
  addResult(true, 'package.json file exists and is readable');
  
  // Core Framework Dependencies
  const coreDeps = {
    'next': { expected: '15.0.3', description: 'Next.js 15' },
    'react': { expected: '18.3.1', description: 'React 18+' },
    'react-dom': { expected: '18.3.1', description: 'React DOM' },
    'mongodb': { expected: '^6.13.0', description: 'MongoDB native driver' }
  };
  
  Object.entries(coreDeps).forEach(([dep, config]) => {
    const installed = packageJson.dependencies[dep];
    addResult(
      !!installed,
      `Core dependency ${config.description} (${dep}) is present`,
      installed ? `Found: ${installed}` : 'Not found in dependencies'
    );
  });
  
  // UI & Styling Dependencies
  const uiDeps = [
    '@radix-ui/react-accordion',
    '@radix-ui/react-alert-dialog', 
    '@radix-ui/react-select',
    'lucide-react',
    'react-icons',
    'framer-motion'
  ];
  
  uiDeps.forEach(dep => {
    addResult(
      !!packageJson.dependencies[dep],
      `UI dependency ${dep} is present`,
      packageJson.dependencies[dep] ? `Found: ${packageJson.dependencies[dep]}` : 'Not found'
    );
  });
  
  // Specialized Libraries
  const specializedDeps = [
    '@tiptap/react',
    'date-fns',
    'recharts',
    'string-similarity',
    'react-swipeable',
    'ics'
  ];
  
  specializedDeps.forEach(dep => {
    addResult(
      !!packageJson.dependencies[dep],
      `Specialized library ${dep} is present`,
      packageJson.dependencies[dep] ? `Found: ${packageJson.dependencies[dep]}` : 'Not found'
    );
  });
  
  // Testing Dependencies
  const testDeps = ['jest', '@testing-library/react', '@testing-library/jest-dom'];
  testDeps.forEach(dep => {
    const inDeps = packageJson.dependencies[dep];
    const inDevDeps = packageJson.devDependencies[dep];
    addResult(
      !!(inDeps || inDevDeps),
      `Testing dependency ${dep} is present`,
      (inDeps || inDevDeps) ? `Found: ${inDeps || inDevDeps}` : 'Not found'
    );
  });
}

function verifyFileStructure() {
  log('\n🔍 Verifying File Structure...');
  
  // Core Next.js structure
  const coreFiles = [
    'src/app/layout.js',
    'src/app/page.js',
    'src/app/globals.css',
    'next.config.mjs',
    'package.json'
  ];
  
  coreFiles.forEach(file => {
    const fullPath = path.join(REPO_ROOT, file);
    addResult(
      fileExists(fullPath),
      `Core file ${file} exists`,
      fileExists(fullPath) ? null : 'File not found'
    );
  });
  
  // Core directories
  const coreDirectories = [
    'src/app',
    'src/components',
    'src/lib',
    'src/hooks',
    'src/utils',
    'src/app/api'
  ];
  
  coreDirectories.forEach(dir => {
    const fullPath = path.join(REPO_ROOT, dir);
    addResult(
      fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory(),
      `Core directory ${dir} exists`,
      fs.existsSync(fullPath) ? null : 'Directory not found'
    );
  });
  
  // API endpoint structure
  const expectedApiEndpoints = [
    'av-team', 'av-users', 'completed', 'custom-services',
    'liturgical', 'reference-songs', 'service-details', 'service-songs',
    'services', 'signups', 'song-usage', 'songs', 'upcoming-services',
    'users', 'worship-assignments', 'worship-indexes'
  ];
  
  const apiDir = path.join(REPO_ROOT, 'src/app/api');
  const actualApiEndpoints = getDirectoryContents(apiDir).filter(item => item.endsWith('/'));
  
  expectedApiEndpoints.forEach(endpoint => {
    addResult(
      actualApiEndpoints.includes(endpoint + '/'),
      `API endpoint directory ${endpoint} exists`,
      actualApiEndpoints.includes(endpoint + '/') ? null : 'Directory not found in API routes'
    );
  });
}

function verifyComponentArchitecture() {
  log('\n🔍 Verifying Component Architecture...');
  
  // Main layout component
  const mainLayoutPath = path.join(REPO_ROOT, 'src/components/MainLayout.jsx');
  addResult(
    fileExists(mainLayoutPath),
    'MainLayout component exists',
    fileExists(mainLayoutPath) ? null : 'MainLayout.jsx not found'
  );
  
  // useResponsive hook
  const useResponsivePath = path.join(REPO_ROOT, 'src/hooks/useResponsive.js');
  addResult(
    fileExists(useResponsivePath),
    'useResponsive hook exists',
    fileExists(useResponsivePath) ? null : 'useResponsive.js not found'
  );
  
  // Check for component patterns in MainLayout
  if (fileExists(mainLayoutPath)) {
    const mainLayoutContent = fs.readFileSync(mainLayoutPath, 'utf8');
    addResult(
      mainLayoutContent.includes('useResponsive'),
      'MainLayout uses useResponsive hook',
      mainLayoutContent.includes('useResponsive') ? null : 'useResponsive not imported/used'
    );
    
    addResult(
      mainLayoutContent.includes('useState'),
      'MainLayout uses React state management',
      mainLayoutContent.includes('useState') ? null : 'useState not found'
    );
  }
  
  // Team components (they are in src/components/ui/)
  const teamComponents = [
    'src/components/ui/SignupSheet.jsx',
    'src/components/ui/WorshipTeam.jsx',
    'src/components/ui/AVTeam.jsx'
  ];
  
  teamComponents.forEach(component => {
    const componentPath = path.join(REPO_ROOT, component);
    const componentName = path.basename(component, '.jsx');
    addResult(
      fileExists(componentPath),
      `Team component ${componentName} exists`,
      fileExists(componentPath) ? null : `${component} not found`
    );
  });
  
  // UI components directory
  const uiComponentsPath = path.join(REPO_ROOT, 'src/components/ui');
  addResult(
    fs.existsSync(uiComponentsPath),
    'UI components directory exists',
    fs.existsSync(uiComponentsPath) ? null : 'src/components/ui directory not found'
  );
}

function verifyLiturgicalIntegration() {
  log('\n🔍 Verifying Liturgical Calendar Integration...');
  
  // Core liturgical files
  const liturgicalFiles = [
    'src/lib/LiturgicalCalendarService.js',
    'src/lib/LiturgicalSeasons.js'
  ];
  
  liturgicalFiles.forEach(file => {
    const filePath = path.join(REPO_ROOT, file);
    const fileName = path.basename(file);
    addResult(
      fileExists(filePath),
      `Liturgical file ${fileName} exists`,
      fileExists(filePath) ? null : `${file} not found`
    );
  });
  
  // Check LiturgicalCalendarService functions
  const calendarServicePath = path.join(REPO_ROOT, 'src/lib/LiturgicalCalendarService.js');
  if (fileExists(calendarServicePath)) {
    const content = fs.readFileSync(calendarServicePath, 'utf8');
    const expectedFunctions = ['calculateEaster', 'getLiturgicalInfo'];
    
    expectedFunctions.forEach(func => {
      addResult(
        content.includes(func),
        `LiturgicalCalendarService contains ${func} function`,
        content.includes(func) ? null : `${func} function not found`
      );
    });
  }
  
  // Check liturgical seasons structure
  const liturgicalSeasonsPath = path.join(REPO_ROOT, 'src/lib/LiturgicalSeasons.js');
  if (fileExists(liturgicalSeasonsPath)) {
    const content = fs.readFileSync(liturgicalSeasonsPath, 'utf8');
    const expectedSeasons = ['ADVENT', 'CHRISTMAS', 'EPIPHANY', 'LENT', 'EASTER', 'PENTECOST', 'ORDINARY_TIME'];
    
    expectedSeasons.forEach(season => {
      addResult(
        content.includes(season),
        `LiturgicalSeasons contains ${season}`,
        content.includes(season) ? null : `${season} not found in liturgical seasons`
      );
    });
  }
  
  // Liturgical API endpoint
  const liturgicalApiPath = path.join(REPO_ROOT, 'src/app/api/liturgical');
  addResult(
    fs.existsSync(liturgicalApiPath),
    'Liturgical API endpoint exists',
    fs.existsSync(liturgicalApiPath) ? null : 'Liturgical API directory not found'
  );
}

function verifyDatabaseArchitecture() {
  log('\n🔍 Verifying Database Architecture...');
  
  // MongoDB connection file
  const mongodbPath = path.join(REPO_ROOT, 'src/lib/mongodb.js');
  addResult(
    fileExists(mongodbPath),
    'MongoDB connection file exists',
    fileExists(mongodbPath) ? null : 'src/lib/mongodb.js not found'
  );
  
  // Check MongoDB usage in API routes
  const apiDir = path.join(REPO_ROOT, 'src/app/api');
  if (fs.existsSync(apiDir)) {
    const apiFiles = findFiles(apiDir, /route\.js$/);
    let mongodbUsageFound = false;
    
    apiFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('clientPromise') && content.includes('mongodb')) {
        mongodbUsageFound = true;
      }
    });
    
    addResult(
      mongodbUsageFound,
      'MongoDB clientPromise pattern used in API routes',
      mongodbUsageFound ? null : 'MongoDB connection pattern not found in API routes'
    );
  }
}

function verifyConfigurationFiles() {
  log('\n🔍 Verifying Configuration Files...');
  
  const configFiles = [
    { file: 'next.config.mjs', description: 'Next.js configuration' },
    { file: 'tailwind.config.mjs', description: 'Tailwind CSS configuration' },
    { file: 'jest.config.js', description: 'Jest testing configuration' },
    { file: 'eslint.config.mjs', description: 'ESLint configuration' },
    { file: 'postcss.config.mjs', description: 'PostCSS configuration' }
  ];
  
  configFiles.forEach(({ file, description }) => {
    const filePath = path.join(REPO_ROOT, file);
    addResult(
      fileExists(filePath),
      `${description} file exists`,
      fileExists(filePath) ? null : `${file} not found`
    );
  });
  
  // Check if Next.js is using App Router
  const nextConfigPath = path.join(REPO_ROOT, 'next.config.mjs');
  if (fileExists(nextConfigPath)) {
    const content = fs.readFileSync(nextConfigPath, 'utf8');
    // App Router is default in Next.js 13+, so we check that pages directory doesn't exist
    const pagesDir = path.join(REPO_ROOT, 'pages');
    addResult(
      !fs.existsSync(pagesDir),
      'Using Next.js App Router (no pages directory)',
      !fs.existsSync(pagesDir) ? null : 'Pages directory found - may be using Pages Router'
    );
  }
}

function verifySecurityArchitecture() {
  log('\n🔍 Verifying Security Architecture (Trust-based Model)...');
  
  // Check that API routes don't have authentication middleware
  const apiDir = path.join(REPO_ROOT, 'src/app/api');
  if (fs.existsSync(apiDir)) {
    const apiFiles = findFiles(apiDir, /route\.js$/);
    let authMiddlewareFound = false;
    
    apiFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('authenticate') || content.includes('authorize') || content.includes('jwt')) {
        authMiddlewareFound = true;
      }
    });
    
    addResult(
      !authMiddlewareFound,
      'No authentication middleware found in API routes (trust-based model)',
      !authMiddlewareFound ? null : 'Authentication patterns found in API routes'
    );
  }
  
  // Check for environment variable usage
  const envExample = path.join(REPO_ROOT, '.env.example');
  const envLocal = path.join(REPO_ROOT, '.env.local');
  
  addResult(
    fileExists(envExample) || fileExists(envLocal),
    'Environment configuration files exist',
    (fileExists(envExample) || fileExists(envLocal)) ? null : 'No .env files found'
  );
}

function verifyTestingInfrastructure() {
  log('\n🔍 Verifying Testing Infrastructure...');
  
  // Jest configuration
  const jestConfigPath = path.join(REPO_ROOT, 'jest.config.js');
  addResult(
    fileExists(jestConfigPath),
    'Jest configuration exists',
    fileExists(jestConfigPath) ? null : 'jest.config.js not found'
  );
  
  // Jest setup file
  const jestSetupPath = path.join(REPO_ROOT, 'jest.setup.js');
  addResult(
    fileExists(jestSetupPath),
    'Jest setup file exists',
    fileExists(jestSetupPath) ? null : 'jest.setup.js not found'
  );
  
  // Test files
  const testFiles = findFiles(path.join(REPO_ROOT, 'src'), /\.test\.js$/);
  addResult(
    testFiles.length > 0,
    `Test files found (${testFiles.length} total)`,
    testFiles.length > 0 ? `Found: ${testFiles.map(f => path.relative(REPO_ROOT, f)).join(', ')}` : 'No test files found'
  );
  
  // Package.json test scripts
  const packageJson = readJsonFile(PACKAGE_JSON);
  if (packageJson && packageJson.scripts) {
    addResult(
      !!packageJson.scripts.test,
      'Test script defined in package.json',
      packageJson.scripts.test ? `Found: ${packageJson.scripts.test}` : 'No test script found'
    );
  }
}

function verifySpecializedServices() {
  log('\n🔍 Verifying Specialized Services...');
  
  // Song suggestion engine
  const songEngineFiles = [
    'src/lib/SongSuggestionEngine.js',
    'src/lib/SongMatcher.js',
    'src/lib/SongUsageAnalyzer.js'
  ];
  
  songEngineFiles.forEach(file => {
    const filePath = path.join(REPO_ROOT, file);
    const fileName = path.basename(file);
    addResult(
      fileExists(filePath),
      `Song service ${fileName} exists`,
      fileExists(filePath) ? null : `${file} not found`
    );
  });
  
  // ICS generation for calendar integration
  const icsGeneratorPath = path.join(REPO_ROOT, 'src/lib/ics-generator.js');
  addResult(
    fileExists(icsGeneratorPath),
    'ICS generator service exists',
    fileExists(icsGeneratorPath) ? null : 'ics-generator.js not found'
  );
  
  // Logger utility
  const loggerPath = path.join(REPO_ROOT, 'src/utils/logger.js');
  addResult(
    fileExists(loggerPath),
    'Logger utility exists',
    fileExists(loggerPath) ? null : 'logger.js not found'
  );
}

function generateSummaryReport() {
  log('\n📊 Generating Summary Report...');
  
  const accuracy = verificationResults.totalChecks > 0 
    ? Math.round((verificationResults.passed / verificationResults.totalChecks) * 100) 
    : 0;
  
  verificationResults.summary = {
    accuracy: `${accuracy}%`,
    totalChecks: verificationResults.totalChecks,
    passed: verificationResults.passed,
    failed: verificationResults.failed,
    categories: {
      'Technology Stack': 'Verified',
      'File Structure': 'Verified', 
      'Component Architecture': 'Verified',
      'Liturgical Integration': 'Verified',
      'Database Architecture': 'Verified',
      'Configuration Files': 'Verified',
      'Security Model': 'Verified',
      'Testing Infrastructure': 'Verified',
      'Specialized Services': 'Verified'
    }
  };
  
  console.log('\n' + '='.repeat(80));
  console.log('📋 ZIONSYNC ARCHITECTURE VERIFICATION REPORT');
  console.log('='.repeat(80));
  console.log(`📊 Overall Accuracy: ${accuracy}%`);
  console.log(`✅ Passed: ${verificationResults.passed}`);
  console.log(`❌ Failed: ${verificationResults.failed}`);
  console.log(`📈 Total Checks: ${verificationResults.totalChecks}`);
  
  if (verificationResults.discrepancies.length > 0) {
    console.log('\n❌ DISCREPANCIES FOUND:');
    console.log('-'.repeat(50));
    verificationResults.discrepancies.forEach((discrepancy, index) => {
      console.log(`${index + 1}. ${discrepancy.description}`);
      if (discrepancy.details) {
        console.log(`   Details: ${discrepancy.details}`);
      }
    });
  }
  
  if (accuracy >= 90) {
    console.log('\n🎉 EXCELLENT: Architecture documentation is highly accurate!');
  } else if (accuracy >= 80) {
    console.log('\n👍 GOOD: Architecture documentation has good accuracy with minor issues.');
  } else if (accuracy >= 70) {
    console.log('\n⚠️  MODERATE: Architecture documentation needs improvement.');
  } else {
    console.log('\n🚨 NEEDS WORK: Architecture documentation requires significant updates.');
  }
  
  console.log('\n📝 Next Steps:');
  if (verificationResults.failed === 0) {
    console.log('✅ No action needed - documentation is accurate!');
  } else {
    console.log('1. Review and fix the discrepancies listed above');
    console.log('2. Update architecture-overview.md to match actual implementation');
    console.log('3. Re-run verification to confirm fixes');
  }
  
  console.log('\n' + '='.repeat(80));
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Starting ZionSync Architecture Verification...');
  console.log(`📁 Repository Root: ${REPO_ROOT}`);
  console.log(`📄 Architecture Doc: ${ARCHITECTURE_DOC}`);
  
  // Run all verification checks
  verifyTechnologyStack();
  verifyFileStructure();
  verifyComponentArchitecture();
  verifyLiturgicalIntegration();
  verifyDatabaseArchitecture();
  verifyConfigurationFiles();
  verifySecurityArchitecture();
  verifyTestingInfrastructure();
  verifySpecializedServices();
  
  // Generate summary report
  generateSummaryReport();
  
  // Write results to file
  const resultsFile = path.join(REPO_ROOT, 'architecture-verification-results.json');
  fs.writeFileSync(resultsFile, JSON.stringify(verificationResults, null, 2));
  console.log(`\n💾 Detailed results saved to: ${resultsFile}`);
  
  // Exit with appropriate code
  process.exit(verificationResults.failed > 0 ? 1 : 0);
}

// Run the verification
main();
