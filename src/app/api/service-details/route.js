import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getLiturgicalInfo } from '@/lib/LiturgicalCalendarService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const timestamp = searchParams.get('_t');
    
    // Only log cache-busted requests (manual/event refreshes)
    if (timestamp) {
      console.log(`📥 API: Cache-busted refresh request (timestamp: ${timestamp})`);
    }

    const client = await clientPromise;
    const db = client.db("church");

    let details;
    if (date) {
      details = await db.collection("serviceDetails").findOne({ date });
      
      // Log readings being returned for this specific date
      if (details?.elements) {
        const readings = details.elements.filter(el => el.type === 'reading') || [];
        if (timestamp) {
          console.log(`📖 API: GET-${timestamp} - Returning readings for ${date}:`, readings.map(r => ({ content: r.content, reference: r.reference })));
        }
      }
      // If we have content but no elements, parse the content
      if (details?.content && !details.elements) {
        details.elements = parseServiceContent(details.content);
        // Save the parsed elements back to the database
        await db.collection("serviceDetails").updateOne(
          { date },
          { $set: { elements: details.elements } }
        );
      }
      
      // Add liturgical information if not already present
      if (details && !details.liturgical) {
        // Parse date string to Date object (assuming format M/D/YY)
        // For example: 1/5/25 -> January 5, 2025
        const [month, day, yearShort] = date.split('/').map(num => parseInt(num, 10));
        // Convert 2-digit year to 4-digit (assuming 20xx for years less than 50)
        const fullYear = yearShort < 50 ? 2000 + yearShort : 1900 + yearShort;
        const serviceDate = new Date(fullYear, month - 1, day); // month is 0-indexed in JS Date
        
        // Get liturgical information using our service
        const liturgicalInfo = getLiturgicalInfo(serviceDate);
        
        // Add liturgical information to the details
        details.liturgical = {
          season: liturgicalInfo.seasonId,
          seasonName: liturgicalInfo.season.name,
          color: liturgicalInfo.color,
          specialDay: liturgicalInfo.specialDayId,
          specialDayName: liturgicalInfo.specialDay?.name || null
        };
        
        // Save liturgical info back to database
        await db.collection("serviceDetails").updateOne(
          { date },
          { $set: { liturgical: details.liturgical } }
        );
      }
      
      return NextResponse.json(details || null);
    } else {
      details = await db.collection("serviceDetails").find({}).toArray();
      
      // Log readings for all dates if this is a cache-busted request
      if (timestamp) {
        details.forEach(detail => {
          const readings = detail.elements?.filter(el => el.type === 'reading') || [];
          if (readings.length > 0) {
            console.log(`📖 API: GET-${timestamp} - Returning readings for ${detail.date}:`, readings.map(r => ({ content: r.content, reference: r.reference })));
          }
        });
      }
      // Process each document
      for (let detail of details) {
        if (detail.content && !detail.elements) {
          detail.elements = parseServiceContent(detail.content);
          // Save the parsed elements back to the database
          await db.collection("serviceDetails").updateOne(
            { date: detail.date },
            { $set: { elements: detail.elements } }
          );
        }
        
        // Add liturgical information if not already present
        if (!detail.liturgical) {
          // Parse date string to Date object (assuming format M/D/YY)
          const [month, day, yearShort] = detail.date.split('/').map(num => parseInt(num, 10));
          // Convert 2-digit year to 4-digit
          const fullYear = yearShort < 50 ? 2000 + yearShort : 1900 + yearShort;
          const serviceDate = new Date(fullYear, month - 1, day);
          
          // Get liturgical information using our service
          const liturgicalInfo = getLiturgicalInfo(serviceDate);
          
          // Add liturgical information to the details
          detail.liturgical = {
            season: liturgicalInfo.seasonId,
            seasonName: liturgicalInfo.season.name,
            color: liturgicalInfo.color,
            specialDay: liturgicalInfo.specialDayId,
            specialDayName: liturgicalInfo.specialDay?.name || null
          };
          
          // Save liturgical info back to database
          await db.collection("serviceDetails").updateOne(
            { date: detail.date },
            { $set: { liturgical: detail.liturgical } }
          );
        }
      }
      
      return NextResponse.json(details);
    }
  } catch (e) {
    console.error('GET Error:', e);
    return NextResponse.json(null);
  }
}

// Existing parseServiceContent function
const parseServiceContent = (content) => {
  return content.split('\n').map(line => {
    let type = 'liturgy';
    const lowerLine = line.toLowerCase().trim();

    // Reading detection
    if (lowerLine.includes('reading:') ||
        lowerLine.includes('lesson:') ||
        lowerLine.includes('psalm:') ||
        lowerLine.includes('gospel:')) {
      type = 'reading';
    }
    // Message/Sermon detection
    else if (lowerLine.includes('sermon:') ||
             lowerLine.includes('message:') ||
             lowerLine.includes('children')) {
      type = 'message';
    }
    // Song/Hymn detection
    else if (lowerLine.includes('hymn:') ||
             lowerLine.includes('song:') ||
             lowerLine.includes('anthem:')) {
      type = 'song_hymn';
    }
    // Liturgical song detection
    else if (
      lowerLine.includes('kyrie') ||
      lowerLine.includes('alleluia') ||
      lowerLine.includes('create in me') ||
      lowerLine.includes('lamb of god') ||
      lowerLine.includes('this is the feast') ||
      lowerLine.includes('glory to god') ||
      lowerLine.includes('change my heart')
    ) {
      type = 'liturgical_song';
    }

    return {
      type,
      content: line,
      selection: null
    };
  });
};

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.date) {
      throw new Error('Date is required');
    }

    const client = await clientPromise;
    const db = client.db("church");
    
    // Add liturgical information to the POST data
    if (!body.liturgical) {
      // Parse date string to Date object (assuming format M/D/YY)
      const [month, day, yearShort] = body.date.split('/').map(num => parseInt(num, 10));
      // Convert 2-digit year to 4-digit
      const fullYear = yearShort < 50 ? 2000 + yearShort : 1900 + yearShort;
      const serviceDate = new Date(fullYear, month - 1, day);
      
      // Get liturgical information using our service
      const liturgicalInfo = getLiturgicalInfo(serviceDate);
      
      // Add liturgical information to the body
      body.liturgical = {
        season: liturgicalInfo.seasonId,
        seasonName: liturgicalInfo.season.name,
        color: liturgicalInfo.color,
        specialDay: liturgicalInfo.specialDayId,
        specialDayName: liturgicalInfo.specialDay?.name || null
      };
    }

    // ENHANCED ORPHANED SONG HANDLING
    const existingService = await db.collection("serviceDetails").findOne({ date: body.date });
    let mergedElements = body.elements || [];
    let orphanedSongs = []; // Initialize outside the if block to ensure scope

    // OPTIMISTIC CONCURRENCY CONTROL: Check for version conflicts
    if (existingService?.lastUpdated && body.lastUpdated && 
        existingService.lastUpdated !== body.lastUpdated) {
      console.log('⚠️ CONCURRENCY: Version mismatch detected - applying enhanced merge logic');
      console.log(`⚠️ CONCURRENCY: Existing version: ${existingService.lastUpdated}, Request version: ${body.lastUpdated}`);
      // Continue with merge logic but log the conflict for monitoring
    }

    if (existingService?.elements && body.elements) {
      console.log('🔧 ENHANCED WORKFLOW: Detecting and handling orphaned songs');
      
      // Step 1: Create comprehensive maps of existing songs
      const existingSongSelections = new Map();
      const orphanedSongs = [];
      
      existingService.elements.forEach((element, index) => {
        if ((element.type === 'song_hymn' || element.type === 'song_contemporary') && element.selection) {
          const prefix = element.content?.split(':')[0]?.trim()?.toLowerCase() || '';
          existingSongSelections.set(prefix, {
            selection: element.selection,
            index: index,
            originalContent: element.content,
            originalPrefix: prefix
          });
        }
      });

      // Step 2: Create map of new song positions  
      const newSongPositions = new Set();
      body.elements.forEach((element, index) => {
        if (element.type === 'song_hymn' || element.type === 'song_contemporary') {
          const newPrefix = element.content?.split(':')[0]?.trim()?.toLowerCase() || '';
          newSongPositions.add(newPrefix);
        }
      });

      // Step 3: Identify orphaned songs (exist in old but not in new)
      existingSongSelections.forEach((songInfo, prefix) => {
        if (!newSongPositions.has(prefix)) {
          // This song will be orphaned
          orphanedSongs.push({
            title: songInfo.selection.title,
            originalPrefix: songInfo.originalPrefix,
            selection: songInfo.selection,
            originalContent: songInfo.originalContent
          });
        }
      });

      // Step 4: Store orphaned songs for recovery and log warning
      if (orphanedSongs.length > 0) {
        const orphanWarning = `⚠️ ORPHANED SONGS: ${orphanedSongs.length} song selection(s) will be removed: ${orphanedSongs.map(s => s.title).join(', ')}`;
        console.log(orphanWarning);
        
        // Store orphaned songs for potential recovery
        await db.collection("orphaned_songs").insertOne({
          date: body.date,
          timestamp: new Date().toISOString(),
          orphanedBy: 'pastor_edit',
          orphanedSongs: orphanedSongs,
          serviceTitle: body.title || 'Untitled Service',
          originalElementCount: existingService.elements.length,
          newElementCount: body.elements.length,
          orphanReason: 'Service structure reduced - song positions removed'
        });
        
        console.log(`💾 BACKUP: Stored ${orphanedSongs.length} orphaned songs for potential recovery`);
        
        // Update service_songs collection to maintain consistency
        const serviceSongs = await db.collection("service_songs").findOne({ date: body.date });
        if (serviceSongs) {
          const updatedSelections = {};
          let newSlotIndex = 0;
          
          // Only keep songs that will be preserved in new structure
          body.elements.forEach((element, index) => {
            if (element.type === 'song_hymn' || element.type === 'song_contemporary') {
              const newPrefix = element.content?.split(':')[0]?.trim()?.toLowerCase() || '';
              const existingSelection = existingSongSelections.get(newPrefix);
              
              if (existingSelection) {
                updatedSelections[`song_${newSlotIndex}`] = existingSelection.selection;
                newSlotIndex++;
              }
            }
          });
          
          await db.collection("service_songs").updateOne(
            { date: body.date },
            { 
              $set: { 
                selections: updatedSelections,
                lastSyncedWithServiceDetails: new Date().toISOString(),
                orphanedSongsRemoved: orphanedSongs.length
              }
            }
          );
          
          console.log(`🔄 SYNC: Updated service_songs - kept ${Object.keys(updatedSelections).length} songs, removed ${orphanedSongs.length} orphaned`);
        }
      }

      // Step 5: Merge new elements with existing song selections (same as before)
      mergedElements = body.elements.map((newElement, index) => {
        if (newElement.type === 'song_hymn' || newElement.type === 'song_contemporary') {
          // Extract prefix from new content for matching
          const newPrefix = newElement.content?.split(':')[0]?.trim()?.toLowerCase() || '';
          
          // Check if we have a matching existing song selection
          const existingSelection = existingSongSelections.get(newPrefix);
          
          if (existingSelection) {
            console.log(`🎵 PRESERVED: "${newPrefix}" → ${existingSelection.selection.title}`);
            
            // Reconstruct the full content with the existing selection
            const selection = existingSelection.selection;
            let fullContent;
            
            if (selection.type === 'hymn') {
              fullContent = `${newElement.content.split(':')[0].trim()}: ${selection.title} #${selection.number} (${formatHymnalName(selection.hymnal)})`;
            } else {
              fullContent = selection.author ?
                `${newElement.content.split(':')[0].trim()}: ${selection.title} - ${selection.author}` :
                `${newElement.content.split(':')[0].trim()}: ${selection.title}`;
            }
            
            return {
              ...newElement,
              content: fullContent,
              selection: existingSelection.selection
            };
          }
        }
        
        // For non-song elements or songs without existing selections, return as-is
        return newElement;
      });

      const preservedCount = existingSongSelections.size - orphanedSongs.length;
      console.log(`✅ ENHANCED MERGE: Preserved ${preservedCount} songs, orphaned ${orphanedSongs.length} songs`);
    }

    const updateDoc = {
      date: body.date,
      content: body.content,
      type: body.type,
      setting: body.setting,
      elements: mergedElements, // Use merged elements that preserve song selections
      liturgical: body.liturgical,
      lastUpdated: new Date().toISOString(),
      // Add orphan tracking if songs were orphaned
      ...(orphanedSongs && orphanedSongs.length > 0 && {
        lastOrphanEvent: {
          timestamp: new Date().toISOString(),
          orphanCount: orphanedSongs.length,
          orphanedTitles: orphanedSongs.map(s => s.title)
        }
      })
    };

    // Debug logging for orphan tracking
    console.log(`🐛 DEBUG: orphanedSongs.length = ${orphanedSongs.length}`);
    if (orphanedSongs.length > 0) {
      console.log('🐛 DEBUG: lastOrphanEvent should be added:', {
        timestamp: new Date().toISOString(),
        orphanCount: orphanedSongs.length,
        orphanedTitles: orphanedSongs.map(s => s.title)
      });
      console.log('🐛 DEBUG: updateDoc.lastOrphanEvent =', updateDoc.lastOrphanEvent);
    }

    console.log('🔄 API: Saving document for date:', body.date);
    console.log('🔄 API: Elements being saved:', updateDoc.elements?.length || 0);
    
    // Log readings specifically
    const readings = updateDoc.elements?.filter(el => el.type === 'reading') || [];
    const saveId = `SAVE-${Date.now()}`;
    console.log(`📖 API: ${saveId} - Readings being saved:`, readings.map(r => ({ content: r.content, reference: r.reference })));
    
    // Log preserved song selections
    const songsWithSelections = updateDoc.elements?.filter(el => 
      (el.type === 'song_hymn' || el.type === 'song_contemporary') && el.selection
    ) || [];
    console.log(`🎵 API: ${saveId} - Songs with preserved selections:`, songsWithSelections.map(s => ({ 
      content: s.content, 
      title: s.selection?.title 
    })));
    
    console.log(`🔄 API: ${saveId} - Full document:`, updateDoc);

    const result = await db.collection("serviceDetails").updateOne(
      { date: body.date },
      { $set: updateDoc },
      { upsert: true }
    );

    // Return the updated document
    const updated = await db.collection("serviceDetails").findOne({ date: body.date });
    
    // Log what was actually saved to verify
    const savedReadings = updated.elements?.filter(el => el.type === 'reading') || [];
    console.log(`✅ API: ${saveId} - Readings saved to database:`, savedReadings.map(r => ({ content: r.content, reference: r.reference })));
    
    const savedSongs = updated.elements?.filter(el => 
      (el.type === 'song_hymn' || el.type === 'song_contemporary') && el.selection
    ) || [];
    console.log(`✅ API: ${saveId} - Songs with selections saved to database:`, savedSongs.map(s => ({ 
      content: s.content, 
      title: s.selection?.title 
    })));
    
    return NextResponse.json(updated);
  } catch (e) {
    console.error('POST Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Helper function to format hymnal names (moved here to be accessible)
const formatHymnalName = (hymnal) => {
  if (!hymnal) return '';
  return hymnal.charAt(0).toUpperCase() + hymnal.slice(1);
};

export async function DELETE(request) {
  // Existing DELETE method remains unchanged
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("church");

    const result = await db.collection("serviceDetails").deleteOne({ date });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Service details not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Service details deleted successfully' });
  } catch (e) {
    console.error('DELETE Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}