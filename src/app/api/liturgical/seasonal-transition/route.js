import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getLiturgicalInfo, getNextLiturgicalSeason, getDaysRemainingInSeason } from '@/lib/LiturgicalCalendarService';
import { LITURGICAL_SEASONS } from '@/lib/LiturgicalSeasons';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("church");
    
    // Get current liturgical information
    const currentDate = new Date();
    const liturgicalInfo = getLiturgicalInfo(currentDate);
    const currentSeasonId = liturgicalInfo.seasonId;
    
    // Get information about the next season
    const nextSeasonId = getNextLiturgicalSeason(currentSeasonId);
    const daysRemaining = getDaysRemainingInSeason(currentSeasonId, currentDate);
    
    // Get all songs from the database with their seasonal tags
    const songs = await db.collection("songs").find({}).toArray();
    
    // Get song usage data to determine comfort levels
    const songUsageData = await db.collection("song_usage").find({}).toArray();
    
    // Calculate comfort levels for songs
    const songComfortMap = {};
    songUsageData.forEach(song => {
      const usageCount = song.uses ? song.uses.length : 0;
      // Simple comfort model - more usage = more comfort
      const comfortLevel = Math.min(10, usageCount);
      songComfortMap[song.title] = comfortLevel;
    });
    
    // Season readiness metrics for current season
    const currentSeasonSongs = songs.filter(song => 
      song.seasonalTags && song.seasonalTags.includes(LITURGICAL_SEASONS[currentSeasonId].name)
    );
    const currentSeasonReadiness = {
      seasonId: currentSeasonId,
      seasonName: LITURGICAL_SEASONS[currentSeasonId].name,
      color: LITURGICAL_SEASONS[currentSeasonId].color,
      totalSongs: currentSeasonSongs.length,
      highComfortSongs: currentSeasonSongs.filter(song => 
        (songComfortMap[song.title] || 0) >= 7
      ).length,
      daysRemaining: daysRemaining,
      readinessScore: currentSeasonSongs.length > 0 
        ? Math.round((currentSeasonSongs.filter(song => 
          (songComfortMap[song.title] || 0) >= 7
        ).length / currentSeasonSongs.length) * 100) 
        : 0
    };
    
    // Season readiness metrics for next season
    const nextSeasonSongs = songs.filter(song => 
      song.seasonalTags && song.seasonalTags.includes(LITURGICAL_SEASONS[nextSeasonId].name)
    );
    const nextSeasonReadiness = {
      seasonId: nextSeasonId,
      seasonName: LITURGICAL_SEASONS[nextSeasonId].name,
      color: LITURGICAL_SEASONS[nextSeasonId].color,
      totalSongs: nextSeasonSongs.length,
      highComfortSongs: nextSeasonSongs.filter(song => 
        (songComfortMap[song.title] || 0) >= 7
      ).length,
      daysRemaining: daysRemaining,
      readinessScore: nextSeasonSongs.length > 0 
        ? Math.round((nextSeasonSongs.filter(song => 
          (songComfortMap[song.title] || 0) >= 7
        ).length / nextSeasonSongs.length) * 100) 
        : 0
    };
    
    // Get top songs for upcoming season that need practice (medium comfort)
    const songsNeedingPractice = nextSeasonSongs
      .filter(song => {
        const comfort = songComfortMap[song.title] || 0;
        return comfort > 0 && comfort < 7; // Medium comfort - needs practice
      })
      .map(song => ({
        title: song.title,
        type: song.type,
        comfortScore: songComfortMap[song.title] || 0
      }))
      .sort((a, b) => a.comfortScore - b.comfortScore) // Sort by comfort (ascending)
      .slice(0, 5); // Get top 5
    
    return NextResponse.json({
      currentSeason: currentSeasonReadiness,
      nextSeason: nextSeasonReadiness,
      transitionReady: nextSeasonReadiness.readinessScore >= 70, // Consider "ready" if 70% or more songs are high comfort
      songsNeedingPractice
    });
  } catch (error) {
    console.error('Error in seasonal transition API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}