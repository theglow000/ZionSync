import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("church");
    
    // Get all liturgical seasons from the database
    const songs = await db.collection("songs").find({}).toArray();
    
    // Count songs tagged for each season
    const seasonalDistribution = {};
    
    // Initialize with all known seasons
    const knownSeasons = [
      'Advent', 'Christmas', 'Epiphany', 'Lent', 
      'Holy Week', 'Easter', 'Pentecost', 'Ordinary Time',
      'Reformation', 'All Saints'
    ];
    
    knownSeasons.forEach(season => {
      seasonalDistribution[season] = {
        count: 0,
        hymns: 0,
        contemporary: 0,
        songs: []
      };
    });
    
    // Count songs for each season
    songs.forEach(song => {
      if (song.seasonalTags && song.seasonalTags.length > 0) {
        song.seasonalTags.forEach(season => {
          if (!seasonalDistribution[season]) {
            seasonalDistribution[season] = {
              count: 0,
              hymns: 0,
              contemporary: 0,
              songs: []
            };
          }
          
          seasonalDistribution[season].count++;
          seasonalDistribution[season].songs.push({
            title: song.title,
            type: song.type
          });
          
          if (song.type === 'hymn') {
            seasonalDistribution[season].hymns++;
          } else if (song.type === 'contemporary') {
            seasonalDistribution[season].contemporary++;
          }
        });
      }
    });
    
    // Prepare the response data
    const seasonalGaps = Object.keys(seasonalDistribution)
      .map(season => ({
        season,
        count: seasonalDistribution[season].count,
        hymns: seasonalDistribution[season].hymns,
        contemporary: seasonalDistribution[season].contemporary,
        songs: seasonalDistribution[season].songs.sort((a, b) => a.title.localeCompare(b.title))
      }))
      .sort((a, b) => a.count - b.count); // Sort by count ascending to highlight gaps
    
    return NextResponse.json({
      gaps: seasonalGaps,
      totalSongs: songs.length
    });
  } catch (error) {
    console.error('Error in seasonal gaps API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}