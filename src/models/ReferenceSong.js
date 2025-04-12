/**
 * ReferenceSong.js
 * 
 * This model represents a reference song from a curated collection
 * organized by liturgical season. These songs can be suggested to users
 * and optionally imported into their church's song library.
 */

const ReferenceSong = {
  title: String,             // Song title
  type: String,              // 'hymn' or 'contemporary'
  seasonalTags: Array,       // Array of applicable liturgical seasons
  description: String,       // Brief description of the song's themes and content
  scripturalConnections: Array, // Scripture references connected to the song
  
  // Hymn-specific fields
  number: String,            // Hymn number (if applicable)
  hymnal: String,            // Hymnal version ID
  hymnaryLink: String,       // Link to hymnary.org page
  
  // Contemporary-specific fields
  author: String,            // Artist/composer
  songSelectLink: String,    // Link to CCLI SongSelect
  
  // Common fields
  youtubeLink: String,       // Link to YouTube video
  notes: String,             // Additional information
  tags: Array,               // General purpose tags (e.g., "communion", "opening", "reflective")
  source: String             // Where this reference song came from
};

export default ReferenceSong;