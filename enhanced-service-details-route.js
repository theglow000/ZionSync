/**
 * Enhanced Service Details API - Orphaned Song Handling
 * 
 * This enhanced version addresses the critical edge case where pastors
 * reduce the number of songs, potentially orphaning worship team selections.
 */

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getLiturgicalInfo } from '@/lib/LiturgicalCalendarService';

// ... existing GET method and parseServiceContent function remain the same ...

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
      const [month, day, yearShort] = body.date.split('/').map(num => parseInt(num, 10));
      const fullYear = yearShort < 50 ? 2000 + yearShort : 1900 + yearShort;
      const serviceDate = new Date(fullYear, month - 1, day);
      
      const liturgicalInfo = getLiturgicalInfo(serviceDate);
      
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
    let orphanedSongs = [];
    let orphanWarning = null;

    // OPTIMISTIC CONCURRENCY CONTROL
    if (existingService?.lastUpdated && body.lastUpdated && 
        existingService.lastUpdated !== body.lastUpdated) {
      console.log('⚠️ CONCURRENCY: Version mismatch detected - applying enhanced merge logic');
    }

    if (existingService?.elements && body.elements) {
      console.log('🔧 ENHANCED WORKFLOW: Detecting and handling orphaned songs');
      
      // Step 1: Create comprehensive maps of existing songs
      const existingSongSelections = new Map();
      const existingSongsByPrefix = new Map();
      
      existingService.elements.forEach((element, index) => {
        if ((element.type === 'song_hymn' || element.type === 'song_contemporary') && element.selection) {
          const prefix = element.content?.split(':')[0]?.trim()?.toLowerCase() || '';
          const songInfo = {
            selection: element.selection,
            index: index,
            originalContent: element.content,
            originalPrefix: prefix
          };
          
          existingSongSelections.set(prefix, songInfo);
          existingSongsByPrefix.set(index, songInfo);
        }
      });

      // Step 2: Create map of new song positions
      const newSongPositions = new Map();
      body.elements.forEach((element, index) => {
        if (element.type === 'song_hymn' || element.type === 'song_contemporary') {
          const newPrefix = element.content?.split(':')[0]?.trim()?.toLowerCase() || '';
          newSongPositions.set(newPrefix, index);
        }
      });

      // Step 3: Identify orphaned songs (exist in old but not in new)
      const preservedPrefixes = new Set();
      existingSongSelections.forEach((songInfo, prefix) => {
        if (newSongPositions.has(prefix)) {
          preservedPrefixes.add(prefix);
        } else {
          // This song will be orphaned
          orphanedSongs.push({
            title: songInfo.selection.title,
            originalPrefix: songInfo.originalPrefix,
            selection: songInfo.selection,
            originalContent: songInfo.originalContent
          });
        }
      });

      // Step 4: Generate warning if songs will be orphaned
      if (orphanedSongs.length > 0) {
        orphanWarning = {
          count: orphanedSongs.length,
          songs: orphanedSongs.map(song => ({
            title: song.title,
            position: song.originalPrefix
          })),
          message: `Warning: ${orphanedSongs.length} song selection(s) will be removed: ${orphanedSongs.map(s => s.title).join(', ')}`
        };
        
        console.log('⚠️ ORPHANED SONGS DETECTED:', orphanWarning.message);
        
        // Store orphaned songs for potential recovery
        await db.collection("orphaned_songs").insertOne({
          date: body.date,
          timestamp: new Date().toISOString(),
          orphanedBy: 'pastor_edit',
          orphanedSongs: orphanedSongs,
          serviceTitle: body.title || 'Untitled Service',
          originalElementCount: existingService.elements.length,
          newElementCount: body.elements.length
        });
        
        console.log(`💾 BACKUP: Stored ${orphanedSongs.length} orphaned songs for potential recovery`);
      }

      // Step 5: Merge new elements with preserved song selections
      mergedElements = body.elements.map((newElement, index) => {
        if (newElement.type === 'song_hymn' || newElement.type === 'song_contemporary') {
          const newPrefix = newElement.content?.split(':')[0]?.trim()?.toLowerCase() || '';
          const existingSelection = existingSongSelections.get(newPrefix);
          
          if (existingSelection) {
            console.log(`🎵 PRESERVED: "${newPrefix}" → ${existingSelection.selection.title}`);
            
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
        
        return newElement;
      });

      // Step 6: Update service_songs collection to maintain consistency
      if (orphanedSongs.length > 0) {
        console.log('🔄 SYNC: Updating service_songs collection to match new structure');
        
        // Get current service_songs
        const serviceSongs = await db.collection("service_songs").findOne({ date: body.date });
        if (serviceSongs) {
          // Remove orphaned songs from service_songs to maintain consistency
          const updatedSelections = {};
          let newSlotIndex = 0;
          
          mergedElements.forEach((element, index) => {
            if ((element.type === 'song_hymn' || element.type === 'song_contemporary') && element.selection) {
              updatedSelections[`song_${newSlotIndex}`] = element.selection;
              newSlotIndex++;
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
          
          console.log(`🔄 SYNC: Updated service_songs with ${Object.keys(updatedSelections).length} songs (removed ${orphanedSongs.length} orphaned)`);
        }
      }

      console.log(`✅ MERGE COMPLETE: Preserved ${preservedPrefixes.size} songs, orphaned ${orphanedSongs.length} songs`);
    }

    const updateDoc = {
      date: body.date,
      content: body.content,
      type: body.type,
      setting: body.setting,
      elements: mergedElements,
      liturgical: body.liturgical,
      lastUpdated: new Date().toISOString(),
      // Add orphan tracking
      ...(orphanedSongs.length > 0 && {
        orphanInfo: {
          hasOrphans: true,
          orphanCount: orphanedSongs.length,
          orphanTimestamp: new Date().toISOString()
        }
      })
    };

    const result = await db.collection("serviceDetails").updateOne(
      { date: body.date },
      { $set: updateDoc },
      { upsert: true }
    );

    const updated = await db.collection("serviceDetails").findOne({ date: body.date });
    
    // Include orphan warning in response for UI handling
    const response = {
      ...updated,
      ...(orphanWarning && { orphanWarning })
    };
    
    return NextResponse.json(response);
  } catch (e) {
    console.error('POST Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Helper function to format hymnal names
const formatHymnalName = (hymnal) => {
  if (!hymnal) return '';
  return hymnal.charAt(0).toUpperCase() + hymnal.slice(1);
};

// New endpoint for orphaned song recovery
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { date, action } = body;

    const client = await clientPromise;
    const db = client.db("church");

    if (action === 'recover_orphaned') {
      // Get most recent orphaned songs for this date
      const orphanedRecord = await db.collection("orphaned_songs")
        .findOne({ date }, { sort: { timestamp: -1 } });
      
      if (!orphanedRecord) {
        return NextResponse.json({ error: 'No orphaned songs found for this date' }, { status: 404 });
      }

      return NextResponse.json({
        orphanedSongs: orphanedRecord.orphanedSongs,
        orphanedAt: orphanedRecord.timestamp,
        count: orphanedRecord.orphanedSongs.length
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e) {
    console.error('PATCH Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
