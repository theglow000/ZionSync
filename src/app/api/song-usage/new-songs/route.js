import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '6'); // Default to 6 months
    const limit = parseInt(searchParams.get('limit') || '10'); // Default to 10 songs

    const client = await clientPromise;
    const db = client.db("church");

    // Get current date and date range
    const currentDate = new Date();
    const startDate = new Date(currentDate);
    startDate.setMonth(currentDate.getMonth() - months);

    // Get recently added songs
    const recentSongs = await db.collection("songs")
      .find({
        created: { $gte: startDate, $lte: currentDate }
      })
      .sort({ created: -1 })
      .limit(limit)
      .toArray();

    // Get usage data for these songs
    const songUsageData = await db.collection("song_usage")
      .find({
        title: { $in: recentSongs.map(song => song.title) }
      })
      .toArray();

    // Create a map of song usage for faster lookup
    const usageMap = {};
    songUsageData.forEach(song => {
      usageMap[song.title] = song.uses || [];
    });

    // Process the data to include usage metrics
    const processedSongs = recentSongs.map(song => {
      const uses = usageMap[song.title] || [];
      
      // Sort uses by date (newest first)
      const sortedUses = [...uses].sort((a, b) => 
        new Date(b.dateUsed) - new Date(a.dateUsed)
      );
      
      // Calculate days since addition
      const daysSinceAddition = Math.floor(
        (currentDate - new Date(song.created)) / (1000 * 60 * 60 * 24)
      );
      
      // Calculate average time between uses in days
      let avgDaysBetweenUses = null;
      if (sortedUses.length > 1) {
        let totalDays = 0;
        for (let i = 1; i < sortedUses.length; i++) {
          const daysDiff = Math.floor(
            (new Date(sortedUses[i-1].dateUsed) - new Date(sortedUses[i].dateUsed)) 
            / (1000 * 60 * 60 * 24)
          );
          totalDays += daysDiff;
        }
        avgDaysBetweenUses = totalDays / (sortedUses.length - 1);
      }
      
      // Calculate adoption score based on usage frequency relative to time since addition
      // A higher score means better adoption
      let adoptionScore = 0;
      if (daysSinceAddition > 0) {
        const usesPerMonth = (uses.length / daysSinceAddition) * 30;
        adoptionScore = Math.min(10, usesPerMonth * 5); // Scale to max 10
      }
      
      return {
        _id: song._id,
        title: song.title,
        type: song.type,
        created: song.created,
        daysSinceAddition,
        usageCount: uses.length,
        lastUsed: sortedUses.length > 0 ? sortedUses[0].dateUsed : null,
        avgDaysBetweenUses,
        adoptionScore,
        usageDates: sortedUses.map(u => ({
          date: u.dateUsed,
          service: u.service
        })),
        seasonalTags: song.seasonalTags || []
      };
    });

    // Sort by newest first
    processedSongs.sort((a, b) => new Date(b.created) - new Date(a.created));

    return NextResponse.json({
      newSongs: processedSongs,
      totalCount: processedSongs.length
    });
  } catch (error) {
    console.error('Error in GET /api/song-usage/new-songs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}