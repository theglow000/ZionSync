/**
 * Song Management System Documentation Verification Script
 * 
 * Verifies the accuracy of song-management-system.md against actual implementation
 * Focus: Identify discrepancies in documentation and errors in code
 */

import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, '.env.local');
dotenv.config({ path: envPath });

// Configuration
const DOCUMENTATION_FILE = path.join(__dirname, 'GuidingDocs/song-management-system.md');
const RESULTS_FILE = path.join(__dirname, 'song-management-verification-results.json');

class SongManagementVerifier {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      totalChecks: 0,
      passed: 0,
      failed: 0,
      accuracy: 0,
      sections: {},
      criticalFindings: []
    };
    
    this.client = null;
    this.db = null;
    this.docContent = '';
    this.collections = [];
  }

  async initialize() {
    console.log('🔍 Initializing Song Management System Documentation Verification...\n');
    
    try {
      // Load documentation
      console.log('📄 Loading documentation file...');
      if (!fs.existsSync(DOCUMENTATION_FILE)) {
        throw new Error(`Documentation file not found: ${DOCUMENTATION_FILE}`);
      }
      this.docContent = fs.readFileSync(DOCUMENTATION_FILE, 'utf8');
      console.log(`✅ Documentation loaded (${this.docContent.length} characters)`);
      
      // Connect to database
      console.log('🔌 Connecting to database...');
      const uri = process.env.MONGODB_URI;
      if (!uri) {
        throw new Error('MONGODB_URI environment variable not set');
      }
      
      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db("church");
      console.log('✅ Database connected');
      
      // Get available collections
      console.log('📋 Loading collections...');
      this.collections = await this.db.listCollections().toArray();
      console.log(`✅ Found ${this.collections.length} collections.\n`);
      
    } catch (error) {
      console.error('❌ Initialization failed:', error.message);
      throw error;
    }
  }

  checkClaim(description, expected, actual) {
    this.results.totalChecks++;
    const passed = expected === actual;
    
    if (passed) {
      this.results.passed++;
      console.log(`✅ ${description}`);
    } else {
      this.results.failed++;
      console.log(`❌ ${description}: Expected "${expected}", Found "${actual}"`);
    }
    
    return { passed, expected, actual, description };
  }

  checkExists(description, exists) {
    return this.checkClaim(description, true, exists);
  }

  async verifyDatabaseCollections() {
    console.log('📊 Verifying Database Collections...');
    const results = [];
    
    // Check primary collections from documentation
    const documentedCollections = ['songs', 'song_usage', 'service_songs', 'reference_songs'];
    
    console.log('\n1. Primary Collections from Documentation:');
    for (const collectionName of documentedCollections) {
      const exists = this.collections.some(c => c.name === collectionName);
      results.push(this.checkExists(`Collection "${collectionName}" exists`, exists));
    }
    
    // List actual collections found
    console.log('\n2. Actual Collections Found:');
    const actualCollections = this.collections.map(c => c.name).sort();
    console.log(`   📁 ${actualCollections.join(', ')}`);
    
    return results;
  }

  async verifyDatabaseSchemas() {
    console.log('\n📋 Verifying Database Schemas...');
    const results = [];
    
    try {
      // Check songs collection structure
      console.log('\n1. Songs Collection Schema:');
      const sampleSong = await this.db.collection("songs").findOne({});
      if (sampleSong) {
        console.log('   📄 Sample song fields:', Object.keys(sampleSong).join(', '));
        
        // Check for key documented fields
        const keyFields = ['_id', 'title', 'type', 'author'];
        for (const field of keyFields) {
          const exists = sampleSong.hasOwnProperty(field);
          results.push(this.checkExists(`Songs collection has "${field}" field`, exists));
        }
        
        // Check for field contamination (extra fields not in docs)
        const documentedFields = [
          '_id', 'title', 'type', 'number', 'hymnal', 'author', 'hymnaryLink', 
          'songSelectLink', 'youtubeLink', 'notes', 'created', 'lastUpdated',
          'usageCount', 'songOrder', // Added fields for analytics and Proclaim integration
          'seasonalTags', 'seasonalTagsConfidence', 'rotationStatus'
        ];
        
        const actualFields = Object.keys(sampleSong);
        const extraFields = actualFields.filter(field => !documentedFields.includes(field));
        
        if (extraFields.length > 0) {
          console.log(`   ⚠️  Undocumented fields found: ${extraFields.join(', ')}`);
          this.results.criticalFindings.push(`Songs collection has undocumented fields: ${extraFields.join(', ')}`);
        } else {
          console.log('   ✅ All song fields are documented');
        }
      }
      
      // Check song_usage collection structure (CRITICAL CHECK)
      console.log('\n2. Song Usage Collection Schema:');
      const sampleUsage = await this.db.collection("song_usage").findOne({});
      if (sampleUsage) {
        console.log('   📄 Sample usage fields:', Object.keys(sampleUsage).join(', '));
        
        // CRITICAL CHECK: Documentation shows nested "uses" array, but reality is different
        const hasUsesArray = sampleUsage.hasOwnProperty('uses');
        const hasNestedStructure = hasUsesArray;
        
        if (hasNestedStructure) {
          console.log('   📊 Structure: NESTED (has "uses" array)');
          results.push(this.checkClaim('song_usage has nested structure as documented', true, true));
        } else {
          console.log('   📊 Structure: FLAT (no "uses" array)');
          results.push(this.checkClaim('song_usage has nested structure as documented', true, false));
          this.results.criticalFindings.push('MAJOR DISCREPANCY: song_usage collection is FLAT, not nested as documented');
        }
        
        // Check for flat fields
        const flatFields = ['title', 'type', 'dateUsed', 'service', 'addedBy'];
        for (const field of flatFields) {
          const exists = sampleUsage.hasOwnProperty(field);
          if (exists) {
            console.log(`   ✓ Has flat field: ${field}`);
          }
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Error checking schemas: ${error.message}`);
    }
    
    return results;
  }

  async verifyAPIEndpoints() {
    console.log('\n🛠️ Verifying API Endpoints...');
    const results = [];
    
    // Check documented endpoints vs actual files
    const documentedEndpoints = [
      { path: '/api/songs', file: 'src/app/api/songs/route.js' },
      { path: '/api/songs/merge', file: 'src/app/api/songs/merge/route.js' },
      { path: '/api/song-usage/suggestions', file: 'src/app/api/song-usage/suggestions/route.js' },
      { path: '/api/song-usage/seasonal-type-distribution', file: 'src/app/api/song-usage/seasonal-type-distribution/route.js' },
      { path: '/api/song-usage/seasonal-gaps', file: 'src/app/api/song-usage/seasonal-gaps/route.js' },
      { path: '/api/song-usage/new-songs', file: 'src/app/api/song-usage/new-songs/route.js' },
      { path: '/api/song-usage/check', file: 'src/app/api/song-usage/check/route.js' },
      { path: '/api/song-usage/congregation-comfort', file: 'src/app/api/song-usage/congregation-comfort/route.js' },
      { path: '/api/reference-songs', file: 'src/app/api/reference-songs/route.js' }
    ];
    
    console.log('\n1. Documented Endpoints:');
    for (const endpoint of documentedEndpoints) {
      const filePath = path.join(__dirname, endpoint.file);
      const exists = fs.existsSync(filePath);
      results.push(this.checkExists(`API ${endpoint.path}`, exists));
    }
    
    // Check for actual API files
    console.log('\n2. Actual API Files Found:');
    const apiDir = path.join(__dirname, 'src/app/api');
    if (fs.existsSync(apiDir)) {
      const actualEndpoints = this.findApiFiles(apiDir);
      console.log(`   📁 Found ${actualEndpoints.length} API files:`);
      actualEndpoints.slice(0, 10).forEach(file => console.log(`      - ${file}`));
      if (actualEndpoints.length > 10) {
        console.log(`      ... and ${actualEndpoints.length - 10} more`);
      }
    }
    
    return results;
  }

  findApiFiles(dir, basePath = '') {
    const files = [];
    if (!fs.existsSync(dir)) return files;
    
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...this.findApiFiles(fullPath, path.join(basePath, item)));
      } else if (item === 'route.js') {
        files.push(path.join(basePath, item).replace(/\\/g, '/'));
      }
    }
    return files;
  }

  async verifyImplementationFiles() {
    console.log('\n📁 Verifying Implementation Files...');
    const results = [];
    
    const documentedFiles = [
      'src/lib/SongUsageAnalyzer.js',
      'src/lib/SongSuggestionEngine.js',
      'src/components/ui/SongDatabase.jsx',
      'src/components/ui/SongRediscoveryPanel.jsx'
    ];
    
    console.log('\n1. Core Implementation Files:');
    for (const file of documentedFiles) {
      const filePath = path.join(__dirname, file);
      const exists = fs.existsSync(filePath);
      results.push(this.checkExists(`File ${file}`, exists));
    }
    
    return results;
  }

  generateReport() {
    this.results.accuracy = this.results.totalChecks > 0 ? 
      Math.round((this.results.passed / this.results.totalChecks) * 100) : 0;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 SONG MANAGEMENT SYSTEM VERIFICATION RESULTS');
    console.log('='.repeat(60));
    console.log(`📅 Timestamp: ${this.results.timestamp}`);
    console.log(`📋 Total Checks: ${this.results.totalChecks}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📊 Accuracy: ${this.results.accuracy}%`);
    
    if (this.results.criticalFindings.length > 0) {
      console.log('\n🚨 CRITICAL FINDINGS:');
      this.results.criticalFindings.forEach((finding, i) => {
        console.log(`${i + 1}. ${finding}`);
      });
    }
    
    console.log('\n🔍 ASSESSMENT:');
    if (this.results.accuracy >= 90) {
      console.log('✅ EXCELLENT: Documentation accuracy is very high');
    } else if (this.results.accuracy >= 75) {
      console.log('⚠️  GOOD: Documentation mostly accurate, some discrepancies found');
    } else if (this.results.accuracy >= 60) {
      console.log('⚠️  FAIR: Significant documentation discrepancies identified');
    } else {
      console.log('❌ POOR: Major documentation accuracy issues found');
    }
    
    // Write results to file
    try {
      fs.writeFileSync(RESULTS_FILE, JSON.stringify(this.results, null, 2));
      console.log(`\n📄 Detailed results written to: ${RESULTS_FILE}`);
    } catch (error) {
      console.log(`\n❌ Error writing results file: ${error.message}`);
    }
  }

  async cleanup() {
    if (this.client) {
      await this.client.close();
      console.log('🔌 Database connection closed');
    }
  }

  async run() {
    try {
      console.log('🚀 Starting Song Management System Verification...\n');
      
      await this.initialize();
      
      console.log('\n=== PHASE 1: DATABASE COLLECTIONS ===');
      const collectionResults = await this.verifyDatabaseCollections();
      
      console.log('\n=== PHASE 2: DATABASE SCHEMAS ===');
      const schemaResults = await this.verifyDatabaseSchemas();
      
      console.log('\n=== PHASE 3: API ENDPOINTS ===');
      const apiResults = await this.verifyAPIEndpoints();
      
      console.log('\n=== PHASE 4: IMPLEMENTATION FILES ===');
      const fileResults = await this.verifyImplementationFiles();
      
      console.log('\n=== GENERATING FINAL REPORT ===');
      this.generateReport();
      
    } catch (error) {
      console.error('\n❌ Verification failed:', error.message);
      console.error('Stack:', error.stack);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }
}

// Execute verification
const verifier = new SongManagementVerifier();
verifier.run().catch(console.error);

export default SongManagementVerifier;
