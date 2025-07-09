/**
 * Test Pastor Song Reduction Scenario
 * 
 * This test specifically addresses the user's question:
 * 1. Pastor creates 5 songs
 * 2. Worship team selects all 5 songs
 * 3. Pastor reduces to 3 songs
 * 4. What happens to the 2 orphaned songs?
 */

import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://theglow000:Urbane36$@zionsignupsheet.gt7uf.mongodb.net/?retryWrites=true&w=majority&appName=ZionSignupSheet";

async function testPastorSongReduction() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db("church");
    
    console.log('🔍 Testing Pastor Song Reduction Scenario');
    console.log('==========================================\n');
    console.log('SCENARIO: Pastor creates 5 songs → Worship team selects all 5 → Pastor reduces to 3');
    console.log('QUESTION: What happens to the 2 orphaned songs?\n');
    
    const testDate = '8/1/25';
    
    // Clean slate
    await db.collection("serviceDetails").deleteOne({ date: testDate });
    await db.collection("service_songs").deleteOne({ date: testDate });
    
    // Step 1: Pastor creates initial service with 5 songs
    console.log('📝 Step 1: Pastor creates service with 5 songs...');
    
    const initialService = {
      date: testDate,
      title: "Five Song Service",
      type: "communion",
      content: "Opening Hymn:\nGathering Song:\nHymn of the Day:\nCommunion Hymn:\nSending Song:",
      elements: [
        { id: "1", type: "song_hymn", content: "Opening Hymn:" },
        { id: "2", type: "song_hymn", content: "Gathering Song:" },
        { id: "3", type: "song_hymn", content: "Hymn of the Day:" },
        { id: "4", type: "song_hymn", content: "Communion Hymn:" },
        { id: "5", type: "song_hymn", content: "Sending Song:" }
      ],
      lastUpdated: new Date().toISOString()
    };
    
    await db.collection("serviceDetails").insertOne(initialService);
    console.log('✅ Initial service with 5 song slots created');
    
    // Step 2: Worship team selects all 5 songs
    console.log('\n🎵 Step 2: Worship team selects all 5 songs...');
    
    const allFiveSongs = {
      song_0: { title: "Amazing Grace", type: "hymn", number: "779", hymnal: "cranberry" },
      song_1: { title: "Come, Thou Fount", type: "hymn", number: "807", hymnal: "cranberry" },
      song_2: { title: "How Great Thou Art", type: "hymn", number: "532", hymnal: "cranberry" },
      song_3: { title: "Be Thou My Vision", type: "hymn", number: "793", hymnal: "cranberry" },
      song_4: { title: "Great Is Thy Faithfulness", type: "hymn", number: "733", hymnal: "cranberry" }
    };
    
    const addSongsResponse = await fetch('http://localhost:3000/api/service-songs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: testDate,
        selections: allFiveSongs,
        updatedBy: 'Worship Team'
      })
    });
    
    if (!addSongsResponse.ok) {
      throw new Error(`Failed to add songs: ${addSongsResponse.status}`);
    }
    
    console.log('✅ All 5 songs selected by worship team');
    
    // Verify all 5 songs are in the service
    const afterSongSelection = await db.collection("serviceDetails").findOne({ date: testDate });
    const songsAfterSelection = afterSongSelection.elements.filter(e => e.selection?.title);
    console.log(`   📊 Songs in service: ${songsAfterSelection.length}/5`);
    
    songsAfterSelection.forEach((song, index) => {
      console.log(`   ${index + 1}. ${song.content}`);
    });
    
    // Step 3: Pastor reduces service to only 3 songs (removes Gathering Song and Communion Hymn)
    console.log('\n📝 Step 3: Pastor reduces service to 3 songs (removes Gathering Song and Communion Hymn)...');
    
    const reducedService = {
      date: testDate,
      title: "Reduced Three Song Service",
      type: "communion",
      content: "Opening Hymn:\nHymn of the Day:\nSending Song:",
      elements: [
        { id: "1", type: "song_hymn", content: "Opening Hymn:" },
        { id: "2", type: "song_hymn", content: "Hymn of the Day:" },
        { id: "3", type: "song_hymn", content: "Sending Song:" }
      ],
      lastUpdated: afterSongSelection.lastUpdated
    };
    
    const pastorEditResponse = await fetch('http://localhost:3000/api/service-details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reducedService)
    });
    
    if (!pastorEditResponse.ok) {
      throw new Error(`Pastor edit failed: ${pastorEditResponse.status}`);
    }
    
    console.log('✅ Pastor reduced service to 3 songs');
    
    // Step 4: Analyze what happened to the songs
    console.log('\n🔍 Step 4: Analyzing the results...');
    
    const afterReduction = await db.collection("serviceDetails").findOne({ date: testDate });
    const songsAfterReduction = afterReduction.elements.filter(e => e.type === 'song_hymn');
    const songsWithSelections = songsAfterReduction.filter(e => e.selection?.title);
    
    console.log('\n📊 DETAILED ANALYSIS:');
    console.log('======================');
    console.log(`📈 Original service: 5 song slots, 5 selections`);
    console.log(`📉 Reduced service: ${songsAfterReduction.length} song slots, ${songsWithSelections.length} selections`);
    
    console.log('\n🎵 Song mapping after reduction:');
    songsAfterReduction.forEach((song, index) => {
      if (song.selection?.title) {
        console.log(`   ✅ Position ${index + 1}: ${song.content} → ${song.selection.title}`);
      } else {
        console.log(`   📝 Position ${index + 1}: ${song.content} → PENDING (no selection)`);
      }
    });
    
    // Check what's in the service_songs collection
    console.log('\n📋 Service Songs Collection State:');
    const serviceSongs = await db.collection("service_songs").findOne({ date: testDate });
    if (serviceSongs) {
      Object.entries(serviceSongs.selections).forEach(([key, value]) => {
        if (value?.title) {
          console.log(`   ${key}: ${value.title} (${value.type})`);
        } else {
          console.log(`   ${key}: EMPTY/CLEARED`);
        }
      });
    }
    
    // Key questions to answer
    console.log('\n❓ CRITICAL QUESTIONS ANSWERED:');
    console.log('================================');
    
    const question1 = songsWithSelections.length <= 3;
    console.log(`1. Were orphaned songs removed? ${question1 ? '✅ YES' : '❌ NO'}`);
    console.log(`   → Result: ${songsWithSelections.length} songs preserved from original 5`);
    
    const originalSongTitles = songsAfterSelection.map(s => s.selection.title);
    const currentSongTitles = songsWithSelections.map(s => s.selection.title);
    const preservedSongs = currentSongTitles.filter(title => originalSongTitles.includes(title));
    
    console.log(`2. Which songs were preserved?`);
    preservedSongs.forEach((title, index) => {
      console.log(`   ✅ ${index + 1}. ${title}`);
    });
    
    const lostSongs = originalSongTitles.filter(title => !currentSongTitles.includes(title));
    console.log(`3. Which songs were lost?`);
    if (lostSongs.length > 0) {
      lostSongs.forEach((title, index) => {
        console.log(`   ❌ ${index + 1}. ${title}`);
      });
    } else {
      console.log(`   ✅ No songs were lost!`);
    }
    
    const question4 = songsAfterReduction.length === 3;
    console.log(`4. Does the service structure match pastor's intent? ${question4 ? '✅ YES' : '❌ NO'}`);
    console.log(`   → Service now has ${songsAfterReduction.length} song slots as intended`);
    
    // Test remaining song functionality
    console.log('\n🧪 Step 5: Testing if remaining system still works...');
    
    // Try to add a song to a pending slot
    const testNewSong = {
      song_0: songsWithSelections[0]?.selection || allFiveSongs.song_0,
      song_1: { title: "NEW SONG: Crown Him with Many Crowns", type: "hymn", number: "855", hymnal: "cranberry" },
      song_2: songsWithSelections[2]?.selection || allFiveSongs.song_4
    };
    
    const testResponse = await fetch('http://localhost:3000/api/service-songs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: testDate,
        selections: testNewSong,
        updatedBy: 'Test - Worship Team'
      })
    });
    
    const systemStillWorks = testResponse.ok;
    console.log(`   ${systemStillWorks ? '✅' : '❌'} Can still add songs to remaining slots`);
    
    // Final state check
    const finalState = await db.collection("serviceDetails").findOne({ date: testDate });
    const finalSongs = finalState.elements.filter(e => e.selection?.title);
    console.log(`   📊 Final working state: ${finalSongs.length}/3 songs filled`);
    
    // Summary
    console.log('\n🎯 FINAL ANSWER TO USER\'S QUESTION:');
    console.log('=====================================');
    
    if (lostSongs.length > 0) {
      console.log(`❌ ORPHANED SONGS ARE LOST: ${lostSongs.length} songs disappeared`);
      console.log('   - This is problematic behavior that needs to be addressed');
      console.log('   - Lost songs:', lostSongs.join(', '));
    } else {
      console.log('✅ NO ORPHANED SONGS: All songs were preserved or gracefully handled');
    }
    
    if (songsWithSelections.length > 3) {
      console.log('⚠️  EXTRA SONGS PRESERVED: More songs than expected slots');
      console.log('   - This could cause display issues in the UI');
    }
    
    if (!systemStillWorks) {
      console.log('❌ SYSTEM BROKEN: Cannot add new songs after reduction');
    } else {
      console.log('✅ SYSTEM FUNCTIONAL: Can still manage remaining songs');
    }
    
    return {
      lostSongs: lostSongs.length,
      preservedSongs: preservedSongs.length,
      systemWorking: systemStillWorks,
      structureCorrect: question4
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return null;
  } finally {
    await client.close();
  }
}

// Run the test
testPastorSongReduction().then(result => {
  if (result) {
    console.log('\n📋 SUMMARY FOR DEVELOPER:');
    console.log('==========================');
    console.log(`Lost songs: ${result.lostSongs}`);
    console.log(`Preserved songs: ${result.preservedSongs}`);
    console.log(`System still working: ${result.systemWorking}`);
    console.log(`Structure correct: ${result.structureCorrect}`);
    
    if (result.lostSongs > 0) {
      console.log('\n⚠️  ACTION REQUIRED: Implement orphaned song handling');
    } else {
      console.log('\n✅ NO ACTION REQUIRED: System handles this scenario correctly');
    }
  }
}).catch(console.error);
