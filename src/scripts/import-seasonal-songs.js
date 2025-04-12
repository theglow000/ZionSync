/**
 * Import Reference Songs Script
 * 
 * This script imports song reference data from Markdown files 
 * and populates the reference_songs collection in MongoDB.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

// Get directory paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

// Debug output
console.log('Root directory:', rootDir);
console.log('Checking for .env.local at:', path.join(rootDir, '.env.local'));
console.log('File exists:', fs.existsSync(path.join(rootDir, '.env.local')));

// Try to load environment variables
dotenv.config({ path: path.join(rootDir, '.env.local') });

// Debug output
console.log('MongoDB URI from env:', process.env.MONGODB_URI ? 'Found' : 'Not found');

// If MONGODB_URI is not defined in environment, we'll need to provide it manually
// for testing purposes (replace with your actual connection string)
const uri = process.env.MONGODB_URI || "mongodb+srv://your-mongodb-uri-here";

/**
 * Parse the hymnal and number from a hymn title string
 * @param {string} hymn - Hymn string in the format "Title (ELW 123)"
 * @returns {Object} Object with title, number, and hymnal
 */
function parseHymnInfo(hymn) {
  // Extract hymnal info in parentheses if it exists
  const match = hymn.match(/(.*)\s+\(([A-Z]+)\s+(\d+)\)$/);
  
  if (match) {
    return {
      title: match[1].trim(),
      hymnal: match[2].toLowerCase(), // e.g., "elw"
      number: match[3]
    };
  }
  
  // If no hymnal info, just return the title
  return {
    title: hymn.trim(),
    hymnal: '',
    number: ''
  };
}

/**
 * Convert a liturgical season name to our internal ID format
 * @param {string} seasonName - Human-readable season name
 * @returns {string} Season ID
 */
function getSeasonId(seasonName) {
  const seasonMap = {
    'Advent': 'advent',
    'Christmas': 'christmas',
    'Epiphany': 'epiphany',
    'Lent': 'lent',
    'Holy Week': 'holyWeek',
    'Easter': 'easter',
    'Pentecost': 'pentecost',
    'Ordinary Time': 'ordinaryTime',
    'Reformation': 'reformation',
    'All Saints': 'allSaints',
    'Thanksgiving': 'thanksgiving'
  };
  
  return seasonMap[seasonName] || 'ordinaryTime';
}

/**
 * Parse Markdown content into structured song data
 * @param {string} content - Markdown content
 * @returns {Array} Array of song objects
 */
function parseMarkdownContent(content) {
  const lines = content.split('\n');
  const songs = [];
  
  let currentSeason = '';
  let currentType = '';
  
  for (const line of lines) {
    // Check for season headers (## Season)
    const seasonMatch = line.match(/^##\s+(.+)/);
    if (seasonMatch) {
      currentSeason = seasonMatch[1].trim();
      continue;
    }
    
    // Check for type headers (### Traditional Hymns or ### Contemporary Songs)
    const typeMatch = line.match(/^###\s+(.+)/);
    if (typeMatch) {
      const typeHeader = typeMatch[1].toLowerCase();
      if (typeHeader.includes('traditional') || typeHeader.includes('hymn')) {
        currentType = 'hymn';
      } else if (typeHeader.includes('contemporary')) {
        currentType = 'contemporary';
      }
      continue;
    }
    
    // Parse song entries (- "Song Title" (Hymnal ###))
    const songMatch = line.match(/^-\s+"(.+)"|^-\s+(.+)/);
    if (songMatch && currentSeason) {
      const songTitle = songMatch[1] || songMatch[2];
      if (songTitle) {
        // Setup basic song info
        let song = {
          title: songTitle.trim(),
          type: currentType,
          seasonalTags: [getSeasonId(currentSeason)],
          source: 'seasonal_song_suggestions'
        };
        
        // Parse hymn-specific info if it's a hymn
        if (currentType === 'hymn') {
          const hymnInfo = parseHymnInfo(song.title);
          song.title = hymnInfo.title;
          song.hymnal = hymnInfo.hymnal;
          song.number = hymnInfo.number;
        } else {
          // For contemporary songs, see if there's an author in the format "Title - Author"
          const authorMatch = song.title.match(/(.*)\s+-\s+(.*)/);
          if (authorMatch) {
            song.title = authorMatch[1].trim();
            song.author = authorMatch[2].trim();
          }
        }
        
        songs.push(song);
      }
    }
  }
  
  return songs;
}

/**
 * Import songs from a Markdown file to the database
 */
async function importSongsFromMarkdown(filePath) {
  try {
    // Check if markdown file exists
    if (!fs.existsSync(filePath)) {
      console.error(`Markdown file not found at: ${filePath}`);
      console.log('Creating a sample file for testing purposes...');
      
      // Create a simple sample file
      const sampleContent = `# Seasonal Song Suggestions

## Advent
### Traditional Hymns
- "O Come, O Come, Emmanuel (ELW 257)"
- "Prepare the Royal Highway (ELW 264)"

### Contemporary Songs
- "Light of the World - Lauren Daigle"
- "Come Thou Long Expected Jesus - Meredith Andrews"

## Christmas
### Traditional Hymns
- "Joy to the World (ELW 267)"
- "Hark! The Herald Angels Sing (ELW 270)"

### Contemporary Songs
- "Born is the King - Hillsong"
- "Emmanuel - Chris Tomlin"`;
      
      fs.writeFileSync(filePath, sampleContent, 'utf-8');
      console.log(`Created sample file at: ${filePath}`);
    }
    
    // Read the Markdown file
    const content = fs.readFileSync(filePath, 'utf-8');
    console.log(`Read ${content.length} characters from Markdown file`);
    
    // Parse the Markdown content
    const songs = parseMarkdownContent(content);
    console.log(`Parsed ${songs.length} songs from Markdown content`);
    
    // Connect to MongoDB using direct URI
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db("church");
    
    // Create collection if it doesn't exist
    const collections = await db.listCollections().toArray();
    const collectionExists = collections.some(c => c.name === "reference_songs");
    
    if (!collectionExists) {
      console.log('Creating reference_songs collection...');
      await db.createCollection("reference_songs");
    }
    
    // Delete existing songs with same source
    const deleteResult = await db.collection("reference_songs").deleteMany({
      source: 'seasonal_song_suggestions'
    });
    console.log(`Deleted ${deleteResult.deletedCount} existing songs`);
    
    // Insert songs into the database
    if (songs.length > 0) {
      const result = await db.collection("reference_songs").insertMany(songs);
      console.log(`Imported ${result.insertedCount} songs`);
    } else {
      console.log("No songs found to import");
    }
    
    console.log("Import completed successfully");
    await client.close();
  } catch (error) {
    console.error("Error importing songs:", error);
  }
}

// Get the path to the Markdown file
const markdownPath = path.join(rootDir, 'Seasonal_Song_Suggestions.md');
console.log('Looking for Markdown file at:', markdownPath);

// Run the import
importSongsFromMarkdown(markdownPath);