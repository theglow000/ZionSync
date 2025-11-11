// /src/app/api/song-usage/route.js
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { createValidationResponse } from '@/lib/validation';
import { z } from 'zod';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const songTitle = searchParams.get('title');
  const songId = searchParams.get('songId');
  const monthsBack = parseInt(searchParams.get('months') || '3');
  const includeRotation = searchParams.get('rotation') === 'true';

  try {
    const client = await clientPromise;
    const db = client.db("church");

    // Standardize date comparison for the search
    const currentDate = new Date();
    currentDate.setHours(12, 0, 0, 0);
    const cutoffDate = new Date(currentDate);
    cutoffDate.setMonth(currentDate.getMonth() - monthsBack);

    if (includeRotation) {
      // Get the song data first to include rotation information
      const song = songId ? 
        await db.collection("songs").findOne({ _id: new ObjectId(songId) }) :
        await db.collection("songs").findOne({ title: songTitle });
      
      if (!song) {
        return NextResponse.json({ message: 'Song not found' }, { status: 404 });
      }
      
      // Then get usage information
      const songUsage = await db.collection("song_usage").findOne({ 
        title: song.title,
        "uses.dateUsed": {
          $gte: cutoffDate,
          $lte: currentDate
        }
      });
      
      // Format the usage data similar to the original function
      const formattedUsage = songUsage && songUsage.uses ? 
        songUsage.uses
          .filter(use => {
            const useDate = new Date(use.dateUsed);
            return useDate >= cutoffDate && useDate <= currentDate;
          })
          .map(use => ({
            title: songUsage.title,
            dateUsed: new Date(use.dateUsed).toISOString(),
            service: use.service,
            addedBy: use.addedBy
          })) : [];
      
      // Include rotation status in the response
      return NextResponse.json({
        song: {
          title: song.title,
          _id: song._id,
          type: song.type,
          rotationStatus: song.rotationStatus || {
            isLearning: false,
            isInRotation: false
          }
        },
        usage: formattedUsage
      });
    } else {
      // Original functionality
      const songUsage = await db.collection("song_usage").findOne({ 
        title: songTitle,
        "uses.dateUsed": {
          $gte: cutoffDate,
          $lte: currentDate
        }
      });

      if (!songUsage || !songUsage.uses) {
        return NextResponse.json([]);
      }

      // Filter and format the usage data
      const formattedUsage = songUsage.uses
        .filter(use => {
          const useDate = new Date(use.dateUsed);
          return useDate >= cutoffDate && useDate <= currentDate;
        })
        .map(use => ({
          title: songTitle,
          dateUsed: new Date(use.dateUsed).toISOString(),
          service: use.service,
          addedBy: use.addedBy
        }));

      return NextResponse.json(formattedUsage);
    }
  } catch (e) {
    console.error('Error getting song usage:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Validate input data
    const validation = z.object({
      title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
      date: z.string().regex(/^\d{1,2}\/\d{1,2}\/\d{2}$/, "Date must be in MM/DD/YY format"),
      service: z.string().max(100, "Service name must be less than 100 characters").optional().default(''),
      addedBy: z.string().max(100, "Added by must be less than 100 characters").optional().default('')
    }).safeParse(body);
    
    if (!validation.success) {
      return createValidationResponse(validation.error.errors?.map(err => `${err.path.join('.')}: ${err.message}`) || ['Validation failed']);
    }
    
    const validatedData = validation.data;

    // Standardize the date format when saving
    const [month, day, year] = validatedData.date.split('/').map(Number);
    const standardizedDate = new Date(2000 + year, month - 1, day);
    standardizedDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

    const client = await clientPromise;
    const db = client.db("church");

    // Remove existing usage with standardized date comparison
    await db.collection("song_usage").updateMany(
      {
        "uses.dateUsed": {
          $gte: new Date(standardizedDate.setHours(0, 0, 0, 0)),
          $lt: new Date(standardizedDate.setHours(23, 59, 59, 999))
        },
        "uses.service": validatedData.service 
      },
      { 
        $pull: { 
          uses: { 
            dateUsed: {
              $gte: new Date(standardizedDate.setHours(0, 0, 0, 0)),
              $lt: new Date(standardizedDate.setHours(23, 59, 59, 999))
            },
            service: validatedData.service 
          } 
        } 
      }
    );

    // Add new usage with standardized date
    const result = await db.collection("song_usage").updateOne(
      { title: validatedData.title },
      {
        $setOnInsert: {
          title: validatedData.title,
          type: body.type,
          songData: {
            number: body.number,
            hymnal: body.hymnal,
            author: body.author,
            sheetMusic: body.type === 'hymn' ? body.hymnaryLink : body.songSelectLink,
            youtube: body.youtubeLink,
            notes: body.notes
          }
        },
        $push: {
          uses: {
            dateUsed: standardizedDate,
            service: validatedData.service,
            addedBy: validatedData.addedBy
          }
        }
      },
      { upsert: true }
    );

    // Update the song rotation status after adding the usage
    await updateSongRotationStatus(validatedData.title, db);
    
    // Update the usage count in the songs collection for analytics efficiency
    await db.collection("songs").updateOne(
      { title: validatedData.title },
      { $inc: { usageCount: 1 } }
    );

    return NextResponse.json(result);
  } catch (e) {
    console.error('Error recording song usage:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Add a new endpoint for updating rotation status for all songs
export async function PUT(request) {
  try {
    const client = await clientPromise;
    const db = client.db("church");
    
    const result = await updateAllSongsRotationStatus(db);
    
    return NextResponse.json(result);
  } catch (e) {
    console.error('Error updating song rotation status:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Helper function to update rotation status for a single song
async function updateSongRotationStatus(title, db) {
  try {
    // Get all usage data for this song, sorted by date
    const songUsage = await db.collection("song_usage").findOne({ title });
    
    if (!songUsage || !songUsage.uses || songUsage.uses.length === 0) {
      return null;
    }
    
    // Sort uses by date, most recent first
    const sortedUses = [...songUsage.uses].sort((a, b) => 
      new Date(b.dateUsed) - new Date(a.dateUsed)
    );
    
    // Calculate rotation metrics
    const recentServicesWindow = 6; // Consider last 6 services
    const consecutiveThreshold = 2; // 2+ consecutive uses = learning
    const inRotationThreshold = 3; // 3+ uses in recent window = in rotation
    
    // Get a list of all services sorted by date
    const services = await db.collection("services")
      .find({})
      .sort({ date: -1 })
      .toArray();
    
    // Create a map of service titles to their positions
    const servicePositionMap = {};
    services.forEach((service, index) => {
      servicePositionMap[service.title] = index;
    });
    
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
    
    // Determine rotation status
    const isLearning = maxConsecutiveUses >= consecutiveThreshold;
    const isInRotation = recentUses >= inRotationThreshold;
    const rotationScore = Math.min(10, Math.ceil((recentUses / recentServicesWindow) * 10));
    
    // Update the song with rotation status
    await db.collection("songs").updateOne(
      { title },
      {
        $set: {
          rotationStatus: {
            isLearning,
            isInRotation,
            lastUsed: new Date(sortedUses[0].dateUsed),
            consecutiveUses: maxConsecutiveUses,
            recentUses,
            rotationScore,
            lastUpdated: new Date()
          }
        }
      },
      { upsert: false }
    );
    
    return {
      title,
      isLearning,
      isInRotation,
      consecutiveUses: maxConsecutiveUses,
      recentUses
    };
  } catch (error) {
    console.error("Error updating song rotation status:", error);
    throw error;
  }
}

// Helper function to update rotation status for all songs
async function updateAllSongsRotationStatus(db) {
  try {
    // Get all songs with usage data
    const songUsage = await db.collection("song_usage").find({}).toArray();
    
    const updates = [];
    
    // Process each song
    for (const song of songUsage) {
      const update = await updateSongRotationStatus(song.title, db);
      if (update) {
        updates.push(update);
      }
    }
    
    return {
      totalSongs: songUsage.length,
      updatedSongs: updates.length,
      songDetails: updates
    };
  } catch (error) {
    console.error("Error updating all songs rotation status:", error);
    throw error;
  }
}