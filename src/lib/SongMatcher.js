/**
 * SongMatcher.js
 * 
 * Utility to match reference songs to the church's song library
 * to avoid duplicates and provide better recommendations.
 */

import clientPromise from './mongodb.js';

export class SongMatcher {
  /**
   * Find potential matches for a song in the existing song library
   * 
   * @param {Object} referenceOrQuery - Reference song object or query string
   * @param {Object} options - Matching options
   * @param {number} options.titleSimilarityThreshold - How similar titles must be (0-1)
   * @param {boolean} options.matchHymnNumbers - Whether to match hymn numbers
   * @param {number} options.limit - Maximum number of matches to return
   * @returns {Promise<Array>} - Array of potential matches
   */
  static async findPotentialMatches(referenceOrQuery, options = {}) {
    const {
      titleSimilarityThreshold = 0.8,
      matchHymnNumbers = true,
      limit = 5
    } = options;
    
    try {
      const client = await clientPromise;
      const db = client.db("church");
      
      // Handle both string queries and reference song objects
      const isQueryString = typeof referenceOrQuery === 'string';
      const queryTitle = isQueryString ? referenceOrQuery : referenceOrQuery.title;
      
      // Create a query object
      let query = {};
      
      // For hymns with numbers, we can be more precise
      if (!isQueryString && 
          referenceOrQuery.type === 'hymn' && 
          referenceOrQuery.number && 
          matchHymnNumbers) {
        // Match by hymnal and number for more accurate matching
        query = {
          type: 'hymn',
          $or: [
            // Exact match by number and hymnal
            {
              number: referenceOrQuery.number,
              hymnal: referenceOrQuery.hymnal
            },
            // Similar title match
            {
              title: { $regex: this.createFuzzyRegex(queryTitle), $options: 'i' }
            }
          ]
        };
      } else {
        // For other songs, use fuzzy title matching
        query = {
          title: { $regex: this.createFuzzyRegex(queryTitle), $options: 'i' }
        };
        
        // If we know the type, include it in the query
        if (!isQueryString && referenceOrQuery.type) {
          query.type = referenceOrQuery.type;
        }
      }
      
      // Get potential matches
      const matches = await db.collection("songs")
        .find(query)
        .limit(limit)
        .toArray();
      
      // Calculate similarity scores
      const scoredMatches = matches.map(song => {
        const score = this.calculateSimilarityScore(song, isQueryString ? { title: queryTitle } : referenceOrQuery);
        return { ...song, similarityScore: score };
      });
      
      // Filter by similarity threshold and sort by score
      return scoredMatches
        .filter(match => match.similarityScore >= titleSimilarityThreshold)
        .sort((a, b) => b.similarityScore - a.similarityScore);
    } catch (error) {
      console.error("Error finding potential matches:", error);
      throw error;
    }
  }
  
  /**
   * Calculate a similarity score between two songs
   * 
   * @param {Object} songA - First song
   * @param {Object} songB - Second song
   * @returns {number} - Similarity score (0-1)
   */
  static calculateSimilarityScore(songA, songB) {
    // Start with title similarity
    let score = this.calculateStringSimilarity(songA.title, songB.title);
    
    // Bonus for matching type
    if (songA.type === songB.type) {
      score += 0.1;
    }
    
    // Additional bonus for hymn number matching
    if (songA.type === 'hymn' && songB.type === 'hymn' && 
        songA.number && songB.number && 
        songA.number === songB.number) {
      score += 0.3;
      
      // Even more if hymnal matches too
      if (songA.hymnal === songB.hymnal) {
        score += 0.2;
      }
    }
    
    // Bonus for matching author in contemporary songs
    if (songA.type === 'contemporary' && songB.type === 'contemporary' && 
        songA.author && songB.author && 
        this.calculateStringSimilarity(songA.author, songB.author) > 0.7) {
      score += 0.2;
    }
    
    // Cap at 1.0
    return Math.min(1, score);
  }
  
  /**
   * Calculate similarity between two strings
   * 
   * @param {string} strA - First string
   * @param {string} strB - Second string
   * @returns {number} - Similarity score (0-1)
   */
  static calculateStringSimilarity(strA, strB) {
    if (!strA || !strB) return 0;
    
    // Normalize strings
    const a = strA.toLowerCase().trim();
    const b = strB.toLowerCase().trim();
    
    // Exact match
    if (a === b) return 1;
    
    // Simple Levenshtein distance (character-by-character edit distance)
    const matrix = [];
    
    // Initialize matrix
    for (let i = 0; i <= a.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= b.length; j++) {
      matrix[0][j] = j;
    }
    
    // Fill matrix
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i-1] === b[j-1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i-1][j] + 1,      // deletion
          matrix[i][j-1] + 1,      // insertion
          matrix[i-1][j-1] + cost  // substitution
        );
      }
    }
    
    // Convert distance to similarity score
    const maxLength = Math.max(a.length, b.length);
    if (maxLength === 0) return 1; // Both strings empty
    
    const distance = matrix[a.length][b.length];
    return 1 - (distance / maxLength);
  }
  
  /**
   * Create a MongoDB regex for fuzzy matching
   * 
   * @param {string} text - Text to search for
   * @returns {string} - Regex pattern
   */
  static createFuzzyRegex(text) {
    if (!text) return '';
    
    // Split into words and filter out short words
    const words = text.split(/\s+/).filter(word => word.length > 2);
    
    // If no substantial words, use the original text
    if (words.length === 0) {
      return text;
    }
    
    // Create a regex that matches any of the words
    return words.map(word => `(?=.*${this.escapeRegExp(word)})`).join('');
  }
  
  /**
   * Escape special characters for use in regex
   * 
   * @param {string} string - String to escape
   * @returns {string} - Escaped string
   */
  static escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

export default SongMatcher;