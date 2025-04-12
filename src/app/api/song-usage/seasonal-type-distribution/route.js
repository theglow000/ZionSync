import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("church");

    // Get all songs to analyze
    const songs = await db.collection("songs").find({}).toArray();

    // Calculate the seasonal distribution with song type breakdown
    const seasonalDistributionData = await calculateSeasonalTypeDistribution(songs);

    return NextResponse.json(seasonalDistributionData);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function calculateSeasonalTypeDistribution(songs) {
  // Get unique seasons from all songs
  const allSeasons = new Set();
  songs.forEach(song => {
    if (song.seasonalTags && Array.isArray(song.seasonalTags)) {
      song.seasonalTags.forEach(tag => allSeasons.add(tag));
    }
  });

  // Process each season
  const seasonalDistribution = Array.from(allSeasons).map(seasonName => {
    const seasonSongs = songs.filter(song =>
      song.seasonalTags && song.seasonalTags.includes(seasonName)
    );
    
    const totalSongs = seasonSongs.length;
    const hymns = seasonSongs.filter(song => song.type === 'hymn').length;
    const contemporary = seasonSongs.filter(song => song.type === 'contemporary').length;
    
    return {
      name: seasonName,
      totalSongs,
      hymns,
      contemporary,
      typeRatio: contemporary > 0 ? (hymns / contemporary).toFixed(1) : 'N/A'
    };
  });

  // Sort by total song count
  return seasonalDistribution.sort((a, b) => b.totalSongs - a.totalSongs);
}