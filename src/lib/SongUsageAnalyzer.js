/**
 * SongUsageAnalyzer.js
 * 
 * Utility class for analyzing song usage patterns, tracking repetition,
 * and identifying songs in the "learning phase" or active rotation.
 */

import clientPromise from '@/lib/mongodb';

export class SongUsageAnalyzer {
  /**
   * Analyze song usage patterns to determine repetition and rotation status
   * 
   * @param {Object} options - Configuration options
   * @param {number} options.consecutiveThreshold - Services in a row to be considered "learning" (default: 2)
   * @param {number} options.recentServicesWindow - Services to consider as "recent" (default: 6)
   * @param {number} options.inRotationThreshold - Uses within recent window to be "in rotation" (default: 3)
   * @returns {Promise<Array>} - Array of songs with usage analysis
   */
  static async analyzeSongUsagePatterns(options = {}) {
    const {
      consecutiveThreshold = 2,
      recentServicesWindow = 6,
      inRotationThreshold = 3
    } = options;
    
    try {
      const client = await clientPromise;
      const db = client.db("church");
      
      // Get all songs
      const songs = await db.collection("songs").find({}).toArray();
      
      // Get all services ordered by date (most recent first)
      const services = await db.collection("services")
        .find({})
        .sort({ date: -1 })
        .project({ _id: 1, date: 1, title: 1 })
        .toArray();
        
      // Create a map of service titles to their positions in the sequence
      const servicePositionMap = {};
      services.forEach((service, index) => {
        servicePositionMap[service.title] = index;
      });
      
      // Get song usage data from the song_usage collection
      const songUsage = await db.collection("song_usage").find({}).toArray();
      
      // Analyze each song's usage pattern
      const songAnalysis = songs.map(song => {
        // Find usage data for this song
        const usageData = songUsage.find(usage => usage.title === song.title);
        
        if (!usageData || !usageData.uses || usageData.uses.length === 0) {
          return {
            _id: song._id,
            title: song.title,
            usageCount: 0,
            lastUsed: null,
            maxConsecutiveUses: 0,
            recentUses: 0,
            isLearning: false,
            isInRotation: false,
            rotationScore: 0
          };
        }
        
        // Sort uses by date (most recent first)
        const sortedUses = [...usageData.uses].sort((a, b) => 
          new Date(b.dateUsed) - new Date(a.dateUsed)
        );
        
        // Calculate consecutive uses
        let maxConsecutiveUses = 0;
        let currentConsecutiveUses = 0;
        let previousPosition = -1;
        
        for (let i = 0; i < sortedUses.length; i++) {
          const serviceName = sortedUses[i].service;
          const currentPosition = servicePositionMap[serviceName];
          
          if (currentPosition !== undefined) {
            if (previousPosition === -1 || currentPosition === previousPosition + 1) {
              currentConsecutiveUses++;
            } else {
              currentConsecutiveUses = 1;
            }
            
            maxConsecutiveUses = Math.max(maxConsecutiveUses, currentConsecutiveUses);
            previousPosition = currentPosition;
          }
        }
        
        // Calculate uses in recent window
        const recentUses = sortedUses.filter(use => {
          const serviceName = use.service;
          const position = servicePositionMap[serviceName];
          return position !== undefined && position < recentServicesWindow;
        }).length;
        
        // Determine if song is in "learning phase" or "in rotation"
        const isLearning = maxConsecutiveUses >= consecutiveThreshold;
        const isInRotation = recentUses >= inRotationThreshold;
        
        // Get most recent use date
        const lastUsed = sortedUses.length > 0 ? new Date(sortedUses[0].dateUsed) : null;
        
        return {
          _id: song._id,
          title: song.title,
          usageCount: sortedUses.length,
          lastUsed,
          maxConsecutiveUses,
          recentUses,
          isLearning,
          isInRotation,
          rotationScore: Math.min(10, Math.ceil((recentUses / recentServicesWindow) * 10))
        };
      });
      
      return songAnalysis;
    } catch (error) {
      console.error("Error analyzing song usage patterns:", error);
      throw error;
    }
  }
  
  /**
   * Update songs with rotation status information
   * 
   * @returns {Promise<Object>} - Summary of updates performed
   */
  static async updateSongRotationStatus() {
    try {
      const client = await clientPromise;
      const db = client.db("church");
      
      // Get song usage analysis
      const songAnalysis = await this.analyzeSongUsagePatterns();
      
      // Update songs with rotation status information
      const updatePromises = songAnalysis.map(async (analysis) => {
        const result = await db.collection("songs").updateOne(
          { _id: analysis._id },
          { 
            $set: { 
              rotationStatus: {
                isLearning: analysis.isLearning,
                isInRotation: analysis.isInRotation,
                lastUsed: analysis.lastUsed,
                consecutiveUses: analysis.maxConsecutiveUses,
                recentUses: analysis.recentUses,
                rotationScore: analysis.rotationScore,
                lastUpdated: new Date()
              }
            } 
          }
        );
        
        return {
          songId: analysis._id,
          title: analysis.title,
          success: result.modifiedCount > 0
        };
      });
      
      const results = await Promise.all(updatePromises);
      const successfulUpdates = results.filter(r => r.success);
      
      return {
        totalSongs: songAnalysis.length,
        updatedSongs: successfulUpdates.length,
        songDetails: successfulUpdates
      };
    } catch (error) {
      console.error("Error updating song rotation status:", error);
      throw error;
    }
  }
  
  /**
   * Get the current learning songs (used in consecutive services)
   * 
   * @returns {Promise<Array>} - Array of songs in learning phase
   */
  static async getLearningPhraseSongs() {
    try {
      const client = await clientPromise;
      const db = client.db("church");
      
      return await db.collection("songs").find({
        "rotationStatus.isLearning": true
      }).toArray();
    } catch (error) {
      console.error("Error getting learning phase songs:", error);
      throw error;
    }
  }
  
  /**
   * Get songs in active rotation
   * 
   * @returns {Promise<Array>} - Array of songs in active rotation
   */
  static async getActiveRotationSongs() {
    try {
      const client = await clientPromise;
      const db = client.db("church");
      
      return await db.collection("songs").find({
        "rotationStatus.isInRotation": true
      }).toArray();
    } catch (error) {
      console.error("Error getting active rotation songs:", error);
      throw error;
    }
  }
}

export default SongUsageAnalyzer;