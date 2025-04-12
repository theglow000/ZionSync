import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request) {
  try {
    const client = await clientPromise;
    const db = client.db("church");

    // Get all songs
    const songs = await db.collection("songs").find({}).toArray();

    // Get song usage data
    const songUsage = await db.collection("song_usage").find({}).toArray();

    // Create a map of song usage for faster lookup
    const usageMap = {};
    songUsage.forEach(song => {
      usageMap[song.title] = song.uses || [];
    });

    // Process each song to calculate comfort score
    const processedSongs = [];
    const groups = {
      high: [],
      learning: [],
      low: [],
      unknown: []
    };

    // Process each song to calculate comfort metrics
    songs.forEach(song => {
      const uses = usageMap[song.title] || [];
      
      // Sort uses by date (newest first)
      const sortedUses = [...uses].sort((a, b) => 
        new Date(b.dateUsed) - new Date(a.dateUsed)
      );
      
      // Calculate comfort score based on usage frequency and recency
      let comfortScore = 0;
      let category = 'unknown';
      
      if (sortedUses.length > 0) {
        // Base score on number of uses (max 10 for 10+ uses)
        const useScore = Math.min(10, sortedUses.length) / 10;
        
        // Factor in recency - reduce score for songs not used recently
        const mostRecentUse = new Date(sortedUses[0].dateUsed);
        const daysSinceLastUse = Math.floor((new Date() - mostRecentUse) / (1000 * 60 * 60 * 24));
        
        // Recency factor - songs used within last 60 days get full value, then decreases
        const recencyFactor = Math.max(0, 1 - (Math.max(0, daysSinceLastUse - 60) / 305));
        
        // Calculate final score (0-10 scale)
        comfortScore = useScore * recencyFactor;
        
        // Determine category based on score
        if (comfortScore >= 0.7) {
          category = 'high';
        } else if (comfortScore >= 0.4) {
          category = 'learning';
        } else {
          category = 'low';
        }
      }
      
      const processedSong = {
        title: song.title,
        type: song.type,
        comfortScore,
        usageCount: sortedUses.length,  // Make sure this line exists
        lastUsed: sortedUses.length > 0 ? sortedUses[0].dateUsed : null,
        seasonalTags: song.seasonalTags || []
      };
      
      processedSongs.push(processedSong);
      groups[category].push(processedSong);
    });
    
    // Process seasonal distribution
    const seasons = [
      'Advent', 'Christmas', 'Epiphany', 'Lent', 
      'Easter', 'Pentecost', 'Ordinary Time', 'Special Feasts'
    ];
    
    const seasonal = seasons.map(season => {
      const seasonalSongs = processedSongs.filter(song => 
        song.seasonalTags && song.seasonalTags.includes(season)
      );
      
      const comfort = {
        high: seasonalSongs.filter(s => s.comfortScore >= 0.7).length,
        learning: seasonalSongs.filter(s => s.comfortScore >= 0.4 && s.comfortScore < 0.7).length,
        low: seasonalSongs.filter(s => s.comfortScore > 0 && s.comfortScore < 0.4).length,
        unknown: seasonalSongs.filter(s => s.comfortScore === 0).length
      };
      
      return {
        season,
        total: seasonalSongs.length,
        comfort
      };
    });
    
    // Calculate overall metrics
    const metrics = [
      { name: 'Total Songs', value: processedSongs.length },
      { name: 'High Comfort', value: groups.high.length },
      { name: 'Learning', value: groups.learning.length },
      { name: 'Low Comfort', value: groups.low.length },
      { name: 'Unused', value: groups.unknown.length }
    ];

    return NextResponse.json({
      metrics,
      groups,
      seasonal,
      totalSongs: processedSongs.length
    });
  } catch (error) {
    console.error('Error in GET /api/song-usage/congregation-comfort:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}