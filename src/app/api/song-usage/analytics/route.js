import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("church");
    
    // Get the current date and date one year ago
    const currentDate = new Date();
    const startOfYear = new Date('2025-01-01'); // Only count from beginning of 2025
    
    // Use a better aggregation approach with MongoDB's aggregation pipeline
    const songUsageAggregation = await db.collection("song_usage").aggregate([
      // Unwind the uses array to work with individual usage instances
      { $unwind: "$uses" },
      
      // Filter for dates in 2025
      {
        $match: {
          "uses.dateUsed": {
            $gte: startOfYear,
            $lte: currentDate
          }
        }
      },
      
      // Group by song title and date to eliminate duplicates within the same day
      {
        $group: {
          _id: {
            title: "$title",
            dateKey: {
              $dateToString: { 
                format: "%Y-%m-%d", 
                date: "$uses.dateUsed" 
              }
            }
          },
          title: { $first: "$title" },
          type: { $first: "$type" },
          dateUsed: { $max: "$uses.dateUsed" },
          service: { $first: "$uses.service" },
        }
      },
      
      // Group by song title to count unique dates per song
      {
        $group: {
          _id: "$title",
          title: { $first: "$title" },
          type: { $first: "$type" },
          count: { $sum: 1 },
          lastUsed: { $max: "$dateUsed" },
          dates: { $push: "$dateUsed" }
        }
      },
      
      // Sort by usage count
      { $sort: { count: -1 } }
    ]).toArray();
    
    // Process seasonal patterns
    const seasons = [
      // Only include seasons relevant to 2025 (January-current date)
      { name: 'Epiphany', months: [0, 1], keywords: ['epiphany', 'light', 'kings'] }, // Jan-Feb
      { name: 'Lent', months: [1, 2], keywords: ['lent', 'repent', 'wilderness'] },   // Feb-Mar 
      { name: 'Easter', months: [3], keywords: ['easter', 'resurrection', 'risen'] },  // April
      { name: 'Pentecost', months: [4, 5], keywords: ['pentecost', 'spirit'] },      // May-Jun
      { name: 'Ordinary Time', months: [6, 7, 8, 9, 10], keywords: []} // Jul-Nov
    ];
    
    // Rather than building seasonal analytics from scratch, use the aggregation results
    const seasonalUsage = [];
    
    for (const season of seasons) {
      // Filter songs by the months they were used in
      const songsInSeason = songUsageAggregation
        .filter(song => {
          // Check if any of the song's usage dates fall into this season's months
          return song.dates.some(date => {
            const dateObj = new Date(date);
            return season.months.includes(dateObj.getMonth());
          });
        })
        .map(song => {
          // Count how many times the song was used in this specific season
          const seasonalUses = song.dates.filter(date => {
            const dateObj = new Date(date);
            return season.months.includes(dateObj.getMonth());
          });
          
          return {
            title: song.title,
            type: song.type || 'unknown',
            count: seasonalUses.length
          };
        })
        .filter(song => song.count > 0) // Only include songs that were used in this season
        .sort((a, b) => b.count - a.count) // Sort by frequency
        .slice(0, 10); // Take top 10
      
      seasonalUsage.push({
        season: season.name,
        songs: songsInSeason
      });
    }
    
    // Get song type distribution for all songs in the database
    const allSongs = await db.collection("songs").find({}).toArray();
    const byType = {
      hymn: allSongs.filter(song => song.type === 'hymn').length,
      contemporary: allSongs.filter(song => song.type === 'contemporary').length
    };
    
    return NextResponse.json({
      frequency: songUsageAggregation.map(song => ({
        title: song.title,
        type: song.type || 'unknown',
        count: song.count,
        lastUsed: song.lastUsed
      })),
      seasonal: seasonalUsage,
      byType
    });
  } catch (e) {
    console.error('Error in GET /api/song-usage/analytics:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
