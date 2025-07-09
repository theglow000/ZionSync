/**
 * ZionSync Component Library Documentation Verification
 * 
 * This script verifies the accuracy of component-library.md by comparing
 * documented components against actual implementation in the codebase.
 * 
 * Usage: node verify-component-library.js
 */

const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Verification results tracking
const results = {
  totalComponents: 0,
  foundComponents: 0,
  missingComponents: 0,
  unexpectedComponents: 0,
  componentDetails: [],
  discrepancies: []
};

// Component definitions from documentation
const documentedComponents = {
  // Core UI Primitives
  'Button': {
    location: 'src/components/ui/button.jsx',
    type: 'ui-primitive',
    description: 'Primary interactive element with consistent styling',
    namedExports: ['Button', 'buttonVariants'],
    exportType: 'named'
  },
  'Card': {
    location: 'src/components/ui/card.jsx',
    type: 'ui-primitive',
    description: 'Container component for grouped content',
    namedExports: ['Card', 'CardHeader', 'CardTitle', 'CardDescription', 'CardContent', 'CardFooter'],
    exportType: 'named'
  },
  'Input': {
    location: 'src/components/ui/input.jsx',
    type: 'ui-primitive',
    description: 'Text input with consistent styling',
    namedExports: ['Input'],
    exportType: 'named'
  },
  'Alert': {
    location: 'src/components/ui/alert.jsx',
    type: 'ui-primitive',
    description: 'Notification and status messages',
    namedExports: ['Alert', 'AlertTitle', 'AlertDescription'],
    exportType: 'named'
  },
  'Tabs': {
    location: 'src/components/ui/tabs.jsx',
    type: 'ui-primitive',
    description: 'Tabbed interface using Radix UI',
    namedExports: ['Tabs', 'TabsList', 'TabsTrigger', 'TabsContent'],
    exportType: 'named'
  },
  'Progress': {
    location: 'src/components/ui/progress.jsx',
    type: 'ui-primitive',
    description: 'Progress bar using Radix UI',
    namedExports: ['Progress'],
    exportType: 'named'
  },
  'SimpleProgress': {
    location: 'src/components/ui/SimpleProgress.jsx',
    type: 'ui-primitive',
    description: 'Lightweight progress bar without Radix',
    namedExports: ['SimpleProgress'],
    exportType: 'named'
  },

  // Layout Components
  'MainLayout': {
    location: 'src/components/MainLayout.jsx',
    type: 'layout',
    description: 'Primary application layout with responsive navigation',
    exportType: 'default'
  },
  'SplashScreen': {
    location: 'src/components/SplashScreen.jsx',
    type: 'layout',
    description: 'Landing page with team selection',
    exportType: 'default'
  },

  // Team Components
  'SignupSheet': {
    location: 'src/components/ui/SignupSheet.jsx',
    type: 'team',
    description: 'Presentation team service scheduling',
    exportType: 'default'
  },
  'WorshipTeam': {
    location: 'src/components/ui/WorshipTeam.jsx',
    type: 'team',
    description: 'Worship team scheduling and song management',
    exportType: 'default'
  },
  'AVTeam': {
    location: 'src/components/ui/AVTeam.jsx',
    type: 'team',
    description: 'Audio/Visual team scheduling',
    exportType: 'default'
  },

  // Mobile Components
  'MobileServiceCard': {
    location: 'src/components/ui/MobileServiceCard.jsx',
    type: 'mobile',
    description: 'Mobile-optimized presentation service card display',
    exportType: 'default'
  },
  'MobileWorshipServiceCard': {
    location: 'src/components/ui/MobileWorshipServiceCard.jsx',
    type: 'mobile',
    description: 'Mobile-optimized worship service display',
    exportType: 'default'
  },
  'MobileAVTeamCard': {
    location: 'src/components/ui/MobileAVTeamCard.jsx',
    type: 'mobile',
    description: 'Mobile-optimized AV team assignment display',
    exportType: 'default'
  },
  'MobileWorshipSelect': {
    location: 'src/components/ui/MobileWorshipSelect.jsx',
    type: 'mobile',
    description: 'Mobile-optimized worship team selection interface',
    exportType: 'default'
  },

  // Input Components
  'PastorServiceInput': {
    location: 'src/components/ui/PastorServiceInput.jsx',
    type: 'input',
    description: 'Service content creation and editing interface',
    exportType: 'default'
  },

  // Modal Components
  'UserSelectionModal': {
    location: 'src/components/ui/UserSelectionModal.jsx',
    type: 'modal',
    description: 'Reusable user selection interface',
    exportType: 'default'
  },
  'QuickAddModal': {
    location: 'src/components/ui/QuickAddModal.jsx',
    type: 'modal',
    description: 'Quick song addition to database',
    exportType: 'default'
  },
  'AddCustomService': {
    location: 'src/components/ui/AddCustomService.jsx',
    type: 'modal',
    description: 'Custom service template creation',
    exportType: 'default'
  },
  'ReferenceSongManageModal': {
    location: 'src/components/ui/ReferenceSongManageModal.jsx',
    type: 'modal',
    description: 'Reference song database management interface',
    exportType: 'default'
  },

  // Song Management Components
  'SongDatabase': {
    location: 'src/components/ui/SongDatabase.jsx',
    type: 'song-management',
    description: 'Comprehensive song library management',
    exportType: 'default'
  },
  'ServiceSongSelector': {
    location: 'src/components/ui/ServiceSongSelector.jsx',
    type: 'song-management',
    description: 'Song selection for worship services',
    exportType: 'default'
  },
  'SeasonalTaggingTool': {
    location: 'src/components/ui/SeasonalTaggingTool.jsx',
    type: 'song-management',
    description: 'Bulk liturgical season assignment for songs',
    exportType: 'default'
  },
  'SongRediscoveryPanel': {
    location: 'src/components/ui/SongRediscoveryPanel.jsx',
    type: 'song-management',
    description: 'Song usage analytics and rediscovery recommendations',
    exportType: 'default'
  },
  'ReferenceSongPanel': {
    location: 'src/components/ui/ReferenceSongPanel.jsx',
    type: 'song-management',
    description: 'External song database integration and recommendations',
    exportType: 'default'
  },
  'SongSection': {
    location: 'src/components/ui/SongSection.jsx',
    type: 'song-management',
    description: 'Individual song section component for service display',
    exportType: 'default'
  },
  'SeasonalTips': {
    location: 'src/components/ui/SeasonalTips.jsx',
    type: 'song-management',
    description: 'Liturgical season guidance and tips',
    exportType: 'default'
  },

  // Liturgical Components
  'LiturgicalStyling': {
    location: 'src/components/liturgical/LiturgicalStyling.jsx',
    type: 'liturgical',
    description: 'Season-aware styling and visual indicators',
    namedExports: ['getSeasonClass', 'getSpecialServiceType', 'getHeaderClass', 'SpecialServiceIndicator', 'isTransitionDate'],
    exportType: 'named'
  },
  'LiturgicalDebug': {
    location: 'src/components/liturgical/LiturgicalDebug.jsx',
    type: 'liturgical',
    description: 'Development tool for liturgical calendar debugging',
    namedExports: ['LiturgicalDebugger'],
    exportType: 'named'
  },
  'SeasonalPlanningGuide': {
    location: 'src/components/ui/SeasonalPlanningGuide.jsx',
    type: 'liturgical',
    description: 'Liturgical season planning assistance',
    exportType: 'default'
  },

  // Utility Components
  'DotMatrix': {
    location: 'src/components/DotMatrix.jsx',
    type: 'utility',
    description: 'Animated background pattern',
    exportType: 'default'
  },
  'RotatingSlogan': {
    location: 'src/components/RotatingSlogan.jsx',
    type: 'utility',
    description: 'Animated text rotation for splash screen',
    exportType: 'default'
  }
};

// Hook definitions from documentation
const documentedHooks = {
  'useResponsive': {
    location: 'src/hooks/useResponsive.js',
    description: 'Responsive design utilities'
  },
  'useMediaQuery': {
    location: 'src/hooks/useMediaQuery.js',
    description: 'Media query matching hook'
  }
};

/**
 * Scan directory recursively for component files
 */
function scanDirectory(dir, files = []) {
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath, files);
      } else if (item.match(/\.(jsx?|tsx?)$/) && !item.includes('.test.') && !item.includes('.spec.')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error.message);
  }
  
  return files;
}

/**
 * Extract component information from file content
 */
function analyzeComponentFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative('.', filePath).replace(/\\/g, '/');
    
    const info = {
      path: relativePath,
      exists: true,
      exports: [],
      imports: [],
      props: [],
      hasDefaultExport: false,
      isClientComponent: content.includes("'use client'"),
      usesHooks: [],
      errors: []
    };
    
    // Extract named exports from export statements
    const namedExportMatches = content.matchAll(/export\s+(?:const\s+|function\s+|class\s+)?(\w+)/g);
    for (const match of namedExportMatches) {
      info.exports.push(match[1]);
    }
    
    // Extract exports from export { } statements
    const braceExportMatches = content.matchAll(/export\s+\{\s*([^}]+)\s*\}/g);
    for (const match of braceExportMatches) {
      const exportList = match[1].split(',').map(exp => exp.trim());
      info.exports.push(...exportList);
    }
    
    // Check for default export patterns
    if (content.includes('export default')) {
      info.hasDefaultExport = true;
    }
    
    // Extract imports
    const importMatches = content.matchAll(/import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g);
    for (const match of importMatches) {
      info.imports.push(match[1]);
    }
    
    // Extract hook usage
    const hookMatches = content.matchAll(/use([A-Z]\w+)/g);
    for (const match of hookMatches) {
      info.usesHooks.push(`use${match[1]}`);
    }
    
    return info;
  } catch (error) {
    return {
      path: path.relative('.', filePath).replace(/\\/g, '/'),
      exists: false,
      error: error.message
    };
  }
}

/**
 * Verify a documented component against actual implementation
 */
function verifyComponent(name, documented) {
  const filePath = path.resolve(documented.location);
  
  console.log(`\n${colors.blue}Verifying component: ${colors.bold}${name}${colors.reset}`);
  console.log(`  Expected location: ${documented.location}`);
  
  results.totalComponents++;
  
  if (!fs.existsSync(filePath)) {
    console.log(`  ${colors.red}❌ File not found${colors.reset}`);
    results.missingComponents++;
    results.discrepancies.push({
      type: 'missing-file',
      component: name,
      expected: documented.location,
      actual: 'not found'
    });
    return;
  }
  
  const actual = analyzeComponentFile(filePath);
  console.log(`  ${colors.green}✅ File exists${colors.reset}`);
  results.foundComponents++;
  
  // Verify exports based on export type
  if (documented.exportType === 'named' && documented.namedExports) {
    // Check for named exports
    const missingExports = documented.namedExports.filter(exp => !actual.exports.includes(exp));
    if (missingExports.length > 0) {
      console.log(`  ${colors.yellow}⚠️  Missing named exports: ${missingExports.join(', ')}${colors.reset}`);
      results.discrepancies.push({
        type: 'missing-named-exports',
        component: name,
        expected: documented.namedExports.join(', '),
        actual: `missing: ${missingExports.join(', ')}`
      });
    } else {
      console.log(`  ${colors.green}✅ All named exports found${colors.reset}`);
    }
  } else if (documented.exportType === 'default') {
    // Check for default export
    if (!actual.hasDefaultExport) {
      console.log(`  ${colors.yellow}⚠️  Component should have default export${colors.reset}`);
      results.discrepancies.push({
        type: 'missing-default-export',
        component: name,
        expected: 'default export',
        actual: 'no default export found'
      });
    } else {
      console.log(`  ${colors.green}✅ Default export found${colors.reset}`);
    }
  }
  
  // Verify client component designation for interactive components
  const interactiveComponents = ['Button', 'Input', 'Tabs', 'MobileServiceCard', 'MobileWorshipServiceCard', 'MobileAVTeamCard'];
  if (interactiveComponents.includes(name) && !actual.isClientComponent) {
    console.log(`  ${colors.yellow}⚠️  Interactive component should have 'use client' directive${colors.reset}`);
    results.discrepancies.push({
      type: 'client-directive',
      component: name,
      expected: "'use client' directive",
      actual: 'missing directive'
    });
  } else if (actual.isClientComponent) {
    console.log(`  ${colors.green}✅ Client component directive found${colors.reset}`);
  }
  
  // Store detailed results
  results.componentDetails.push({
    name,
    documented,
    actual
  });
  
  console.log(`  ${colors.green}✅ Component verified${colors.reset}`);
}

/**
 * Verify documented hooks
 */
function verifyHook(name, documented) {
  const filePath = path.resolve(documented.location);
  
  console.log(`\n${colors.blue}Verifying hook: ${colors.bold}${name}${colors.reset}`);
  console.log(`  Expected location: ${documented.location}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`  ${colors.red}❌ File not found${colors.reset}`);
    results.discrepancies.push({
      type: 'missing-hook',
      hook: name,
      expected: documented.location,
      actual: 'not found'
    });
    return;
  }
  
  const actual = analyzeComponentFile(filePath);
  console.log(`  ${colors.green}✅ File exists${colors.reset}`);
  
  // Verify default export
  if (!actual.hasDefaultExport) {
    console.log(`  ${colors.yellow}⚠️  Hook should have default export${colors.reset}`);
    results.discrepancies.push({
      type: 'hook-export',
      hook: name,
      expected: 'default export',
      actual: 'no default export found'
    });
  }
  
  console.log(`  ${colors.green}✅ Hook verified${colors.reset}`);
}

/**
 * Discover undocumented components
 */
function findUndocumentedComponents() {
  console.log(`\n${colors.blue}${colors.bold}Scanning for undocumented components...${colors.reset}`);
  
  const componentDir = 'src/components';
  const allFiles = scanDirectory(componentDir);
  
  const undocumented = [];
  
  for (const filePath of allFiles) {
    const relativePath = path.relative('.', filePath).replace(/\\/g, '/');
    const fileName = path.basename(filePath, path.extname(filePath));
    
    // Check if this component is documented
    const isDocumented = Object.values(documentedComponents).some(comp => 
      comp.location === relativePath
    );
    
    if (!isDocumented) {
      undocumented.push({
        name: fileName,
        path: relativePath,
        type: filePath.includes('ui/') ? 'ui' : 
              filePath.includes('liturgical/') ? 'liturgical' : 'layout'
      });
      results.unexpectedComponents++;
    }
  }
  
  if (undocumented.length > 0) {
    console.log(`\n${colors.yellow}Found ${undocumented.length} undocumented components:${colors.reset}`);
    undocumented.forEach(comp => {
      console.log(`  ${colors.yellow}• ${comp.name}${colors.reset} (${comp.path})`);
      results.discrepancies.push({
        type: 'undocumented-component',
        component: comp.name,
        actual: comp.path,
        expected: 'documentation entry'
      });
    });
  } else {
    console.log(`${colors.green}✅ All components are documented${colors.reset}`);
  }
}

/**
 * Generate verification report
 */
function generateReport() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`${colors.bold}${colors.blue}COMPONENT LIBRARY VERIFICATION REPORT${colors.reset}`);
  console.log(`${'='.repeat(80)}`);
  
  // Summary statistics
  console.log(`\n${colors.bold}SUMMARY:${colors.reset}`);
  console.log(`  Total documented components: ${results.totalComponents}`);
  console.log(`  Components found: ${colors.green}${results.foundComponents}${colors.reset}`);
  console.log(`  Components missing: ${colors.red}${results.missingComponents}${colors.reset}`);
  console.log(`  Undocumented components: ${colors.yellow}${results.unexpectedComponents}${colors.reset}`);
  console.log(`  Total discrepancies: ${colors.red}${results.discrepancies.length}${colors.reset}`);
  
  // Calculate accuracy
  const accuracy = Math.round(
    ((results.foundComponents - results.discrepancies.length) / results.totalComponents) * 100
  );
  console.log(`  ${colors.bold}Documentation Accuracy: ${accuracy}%${colors.reset}`);
  
  // Detailed discrepancies
  if (results.discrepancies.length > 0) {
    console.log(`\n${colors.bold}DISCREPANCIES FOUND:${colors.reset}`);
    
    const groupedDiscrepancies = results.discrepancies.reduce((acc, disc) => {
      if (!acc[disc.type]) acc[disc.type] = [];
      acc[disc.type].push(disc);
      return acc;
    }, {});
    
    Object.entries(groupedDiscrepancies).forEach(([type, items]) => {
      console.log(`\n  ${colors.yellow}${type.toUpperCase()}:${colors.reset}`);
      items.forEach(item => {
        console.log(`    • ${item.component || item.hook}: ${item.actual}`);
      });
    });
  }
  
  // Recommendations
  console.log(`\n${colors.bold}RECOMMENDATIONS:${colors.reset}`);
  
  if (results.missingComponents > 0) {
    console.log(`  ${colors.red}• Update component-library.md to remove ${results.missingComponents} missing components${colors.reset}`);
  }
  
  if (results.unexpectedComponents > 0) {
    console.log(`  ${colors.yellow}• Add documentation for ${results.unexpectedComponents} undocumented components${colors.reset}`);
  }
  
  const clientDirectiveIssues = results.discrepancies.filter(d => d.type === 'client-directive').length;
  if (clientDirectiveIssues > 0) {
    console.log(`  ${colors.yellow}• Add 'use client' directive to ${clientDirectiveIssues} interactive components${colors.reset}`);
  }
  
  const exportIssues = results.discrepancies.filter(d => d.type === 'export-mismatch').length;
  if (exportIssues > 0) {
    console.log(`  ${colors.yellow}• Fix export patterns in ${exportIssues} components${colors.reset}`);
  }
  
  if (results.discrepancies.length === 0) {
    console.log(`  ${colors.green}✅ No improvements needed - documentation is accurate!${colors.reset}`);
  }
  
  console.log(`\n${'='.repeat(80)}`);
  
  return accuracy;
}

/**
 * Main verification function
 */
function main() {
  console.log(`${colors.bold}${colors.blue}ZionSync Component Library Verification${colors.reset}`);
  console.log(`${colors.blue}Verifying component-library.md against actual implementation...${colors.reset}\n`);
  
  // Verify documented components
  console.log(`${colors.bold}VERIFYING DOCUMENTED COMPONENTS:${colors.reset}`);
  Object.entries(documentedComponents).forEach(([name, documented]) => {
    verifyComponent(name, documented);
  });
  
  // Verify documented hooks
  console.log(`\n${colors.bold}VERIFYING DOCUMENTED HOOKS:${colors.reset}`);
  Object.entries(documentedHooks).forEach(([name, documented]) => {
    verifyHook(name, documented);
  });
  
  // Find undocumented components
  findUndocumentedComponents();
  
  // Generate final report
  const accuracy = generateReport();
  
  // Exit with appropriate code
  process.exit(accuracy === 100 ? 0 : 1);
}

// Run verification
if (require.main === module) {
  main();
}

module.exports = { main, results };
