/**
 * Rotation status ("learning", "in rotation") derived from song_usage.
 * Moved verbatim from api/song-usage/route.js so the server-side usage sync
 * can recompute it too.
 */

// Helper function to update rotation status for a single song
export async function updateSongRotationStatus(title, db) {
  try {
    // Get all usage data for this song, sorted by date
    const songUsage = await db.collection("song_usage").findOne({ title });

    if (!songUsage || !songUsage.uses || songUsage.uses.length === 0) {
      return null;
    }

    // Sort uses by date, most recent first
    const sortedUses = [...songUsage.uses].sort(
      (a, b) => new Date(b.dateUsed) - new Date(a.dateUsed),
    );

    // Calculate rotation metrics
    const recentServicesWindow = 6; // Consider last 6 services
    const consecutiveThreshold = 2; // 2+ consecutive uses = learning
    const inRotationThreshold = 3; // 3+ uses in recent window = in rotation

    // Get a list of all services sorted by date
    const services = await db
      .collection("services")
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
        if (
          previousPosition === -1 ||
          currentPosition === previousPosition + 1
        ) {
          currentConsecutiveUses++;
        } else {
          currentConsecutiveUses = 1;
        }

        maxConsecutiveUses = Math.max(
          maxConsecutiveUses,
          currentConsecutiveUses,
        );
        previousPosition = currentPosition;
      }
    }

    // Calculate uses in recent window
    const recentUses = sortedUses.filter((use) => {
      const serviceName = use.service;
      const position = servicePositionMap[serviceName];
      return position !== undefined && position < recentServicesWindow;
    }).length;

    // Determine rotation status
    const isLearning = maxConsecutiveUses >= consecutiveThreshold;
    const isInRotation = recentUses >= inRotationThreshold;
    const rotationScore = Math.min(
      10,
      Math.ceil((recentUses / recentServicesWindow) * 10),
    );

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
            lastUpdated: new Date(),
          },
        },
      },
      { upsert: false },
    );

    return {
      title,
      isLearning,
      isInRotation,
      consecutiveUses: maxConsecutiveUses,
      recentUses,
    };
  } catch (error) {
    console.error("Error updating song rotation status:", error);
    throw error;
  }
}

// Helper function to update rotation status for all songs
export async function updateAllSongsRotationStatus(db) {
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
      songDetails: updates,
    };
  } catch (error) {
    console.error("Error updating all songs rotation status:", error);
    throw error;
  }
}
