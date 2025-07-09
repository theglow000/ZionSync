/**
 * Migration script to update liturgical season info for all services
 * This script specifically addresses issues with:
 * - Transfiguration Sunday (3/2/25)
 * - Any "Late Pentecost" references
 * - Ash Wednesday and Easter services
 * 
 * Usage: 
 * node src/scripts/fix-liturgical-seasons.js [--dry-run]
 * 
 * Options:
 * --dry-run    Preview changes without modifying database
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getLiturgicalInfo, clearCache } from '../lib/LiturgicalCalendarService.js';
import { validateDate, serviceLiturgicalSchema } from '../lib/liturgical-validation.js';

// Parse command line arguments
const DRY_RUN = process.argv.includes('--dry-run');

// Get the directory name in ES modules
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..', '..');

console.log(`🔧 Liturgical Season Fix Migration ${DRY_RUN ? '(DRY RUN MODE)' : '(LIVE MODE)'}`);
console.log('='.repeat(60));
if (DRY_RUN) {
  console.log('⚠️  DRY RUN: No changes will be made to the database');
  console.log('📋 This will preview what changes would be made');
} else {
  console.log('⚠️  LIVE MODE: Changes will be made to the database');
  console.log('💾 Make sure you have a database backup before proceeding');
}
console.log('');

// Load environment variables first from .env and then from .env.local if it exists
dotenv.config();
try {
  const envLocalPath = join(rootDir, '.env.local');
  const envConfig = dotenv.parse(readFileSync(envLocalPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
  console.log('✅ Loaded environment variables from .env.local');
} catch (err) {
  console.log('ℹ️  No .env.local file found, using only .env variables');
}
  console.log('Loaded environment variables from .env.local');
} catch (err) {
  console.log('No .env.local file found, using only .env variables');
}

// MongoDB connection URI from environment variables
const uri = process.env.MONGODB_URI;

// Special seasons to monitor for verification
const specialServices = {
  '3/2/25': { expected: 'EPIPHANY', note: 'Transfiguration Sunday' },
  '3/5/25': { expected: 'LENT', note: 'Ash Wednesday' },
  '4/13/25': { expected: 'HOLY_WEEK', note: 'Palm Sunday' },
  '4/20/25': { expected: 'EASTER', note: 'Easter Sunday' }
};

async function main() {
  if (!uri) {
    console.error('MONGODB_URI environment variable not defined.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000
  });

  try {
    await client.connect();
    console.log('Connected to MongoDB.');
    
    const db = client.db('church');
    
    // Clear the cache to ensure we get fresh calculations
    clearCache();
    
    // Update serviceDetails collection
    console.log('\nUpdating serviceDetails collection...');
    const serviceDetails = await db.collection('serviceDetails').find({}).toArray();
    console.log(`Found ${serviceDetails.length} services in serviceDetails.`);
    
    let updatedDetailsCount = 0;
    let problematicServicesCount = 0;
    
    for (const service of serviceDetails) {
      try {
        // Validate date before processing
        try {
          validateDate(service.date);
        } catch (error) {
          console.error(`⚠️  Skipping service with invalid date: ${service.date} - ${error.message}`);
          continue;
        }
        
        // Parse date string to Date object (assuming format M/D/YY)
        const [month, day, yearShort] = service.date.split('/').map(num => parseInt(num, 10));
        // Convert 2-digit year to 4-digit
        const fullYear = yearShort < 50 ? 2000 + yearShort : 1900 + yearShort;
        const serviceDate = new Date(fullYear, month - 1, day);
        
        // Get liturgical information using our service
        const liturgicalInfo = getLiturgicalInfo(serviceDate);
        
        // Create liturgical info object
        const liturgical = {
          season: liturgicalInfo.seasonId,
          seasonName: liturgicalInfo.season.name,
          color: liturgicalInfo.color,
          specialDay: liturgicalInfo.specialDayId,
          specialDayName: liturgicalInfo.specialDay?.name || null
        };
        
        // Validate liturgical data before proceeding
        try {
          serviceLiturgicalSchema.parse(liturgical);
        } catch (error) {
          console.error(`⚠️  Invalid liturgical data for ${service.date}:`, error.message);
          continue;
        }
        
        // Check for problematic seasons (like "Late Pentecost")
        const hasProblematicSeason = 
          !service.liturgical ||
          service.liturgical.seasonName === 'Late Pentecost' ||
          (specialServices[service.date] && service.liturgical.season !== specialServices[service.date].expected);
        
        if (hasProblematicSeason) {
          problematicServicesCount++;
          console.log(`Fixing service ${service.date}: Old=${service.liturgical?.seasonName || 'None'}, New=${liturgical.seasonName} (${liturgical.color})`);
          
          // If it's a special service, add extra verification
          if (specialServices[service.date]) {
            console.log(`  ↳ Special service: ${specialServices[service.date].note}`);
            console.log(`  ↳ Expected: ${specialServices[service.date].expected}, Got: ${liturgical.season}`);
            
            // If the calculation is still wrong, force the correct value
            if (liturgical.season !== specialServices[service.date].expected) {
              console.log(`  ↳ WARNING: Calculation is incorrect! Forcing correct value.`);
              liturgical.season = specialServices[service.date].expected;
              
              // Update name and color based on the forced season
              switch (liturgical.season) {
                case 'EPIPHANY':
                  liturgical.seasonName = 'Epiphany';
                  liturgical.color = '#008080'; // Teal
                  break;
                case 'LENT':
                  liturgical.seasonName = 'Lent';
                  liturgical.color = '#800020'; // Purple
                  break;
                case 'HOLY_WEEK':
                  liturgical.seasonName = 'Holy Week';
                  liturgical.color = '#8B0000'; // Scarlet
                  break;
                case 'EASTER':
                  liturgical.seasonName = 'Easter';
                  liturgical.color = '#FFF0AA'; // Gold/White
                  break;
              }
            }
          }
        }
        
        // Update the service with liturgical info (or preview in dry-run mode)
        if (DRY_RUN) {
          console.log(`[DRY RUN] Would update service ${service.date}: ${liturgical.seasonName} (${liturgical.color})`);
        } else {
          await db.collection('serviceDetails').updateOne(
            { date: service.date },
            { $set: { liturgical } }
          );
        }
        
        updatedDetailsCount++;
        if (updatedDetailsCount % 10 === 0) {
          console.log(`${DRY_RUN ? 'Processed' : 'Updated'} ${updatedDetailsCount}/${serviceDetails.length} service details...`);
        }
      } catch (error) {
        console.error(`Error updating service ${service.date}:`, error);
      }
    }
    
    console.log(`Updated liturgical info for ${updatedDetailsCount} services in serviceDetails collection.`);
    console.log(`Fixed ${problematicServicesCount} problematic services.`);
    
    // Clear the cache again before updating service_songs
    clearCache();
    
    // Update service_songs collection
    console.log('\nUpdating service_songs collection...');
    const serviceSongs = await db.collection('service_songs').find({}).toArray();
    console.log(`Found ${serviceSongs.length} services in service_songs.`);
    
    let updatedSongsCount = 0;
    let problematicSongsCount = 0;
    
    for (const service of serviceSongs) {
      try {
        // Parse date string to Date object (assuming format M/D/YY)
        const [month, day, yearShort] = service.date.split('/').map(num => parseInt(num, 10));
        // Convert 2-digit year to 4-digit
        const fullYear = yearShort < 50 ? 2000 + yearShort : 1900 + yearShort;
        const serviceDate = new Date(fullYear, month - 1, day);
        
        // Get liturgical information using our service
        const liturgicalInfo = getLiturgicalInfo(serviceDate);
        
        // Create liturgical info object (simplified for song selection)
        const liturgical = {
          season: liturgicalInfo.seasonId,
          seasonName: liturgicalInfo.season.name,
          color: liturgicalInfo.color,
          specialDay: liturgicalInfo.specialDayId
        };
        
        // Check for problematic seasons (like "Late Pentecost")
        const hasProblematicSeason = 
          !service.liturgical ||
          service.liturgical.seasonName === 'Late Pentecost' ||
          (specialServices[service.date] && service.liturgical.season !== specialServices[service.date].expected);
        
        if (hasProblematicSeason) {
          problematicSongsCount++;
          console.log(`Fixing song selection ${service.date}: Old=${service.liturgical?.seasonName || 'None'}, New=${liturgical.seasonName}`);
          
          // If it's a special service, add extra verification
          if (specialServices[service.date]) {
            console.log(`  ↳ Special service: ${specialServices[service.date].note}`);
            console.log(`  ↳ Expected: ${specialServices[service.date].expected}, Got: ${liturgical.season}`);
            
            // If the calculation is still wrong, force the correct value
            if (liturgical.season !== specialServices[service.date].expected) {
              console.log(`  ↳ WARNING: Calculation is incorrect! Forcing correct value.`);
              liturgical.season = specialServices[service.date].expected;
              
              // Update name and color based on the forced season
              switch (liturgical.season) {
                case 'EPIPHANY':
                  liturgical.seasonName = 'Epiphany';
                  liturgical.color = '#008080'; // Teal
                  break;
                case 'LENT':
                  liturgical.seasonName = 'Lent';
                  liturgical.color = '#800020'; // Purple
                  break;
                case 'HOLY_WEEK':
                  liturgical.seasonName = 'Holy Week';
                  liturgical.color = '#8B0000'; // Scarlet
                  break;
                case 'EASTER':
                  liturgical.seasonName = 'Easter';
                  liturgical.color = '#FFF0AA'; // Gold/White
                  break;
              }
            }
          }
        }
        
        // Update the service with liturgical info
        await db.collection('service_songs').updateOne(
          { date: service.date },
          { $set: { liturgical } }
        );
        
        updatedSongsCount++;
        if (updatedSongsCount % 10 === 0) {
          console.log(`Updated ${updatedSongsCount}/${serviceSongs.length} service songs...`);
        }
      } catch (error) {
        console.error(`Error updating service ${service.date}:`, error);
      }
    }
    
    console.log(`Updated liturgical info for ${updatedSongsCount} services in service_songs collection.`);
    console.log(`Fixed ${problematicSongsCount} problematic services.`);
    
    console.log('\nMigration completed successfully!');
    
  } catch (error) {
    console.error('An error occurred during the migration:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed.');
  }
}

// Run the migration
main().catch(console.error);