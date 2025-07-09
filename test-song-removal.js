/**
 * Test Song Removal Feature
 * 
 * This test verifies that the new song removal/clear feature works correctly
 * and maintains compatibility with all Phase 4C improvements.
 */

import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://theglow000:Urbane36$@zionsignupsheet.gt7uf.mongodb.net/?retryWrites=true&w=majority&appName=ZionSignupSheet";

async function testSongRemoval() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db("church");
    
    console.log('🧪 Testing Song Removal Feature');
    console.log('=====================================\n');
    
    const testDate = '7/20/25';
    
    // Clean slate
    await db.collection("serviceDetails").deleteOne({ date: testDate });
    await db.collection("service_songs").deleteOne({ date: testDate });
    
    // Step 1: Create initial service with 3 song slots
    console.log('📝 Step 1: Creating service with 3 song slots...');
    
    const initialService = {
      date: testDate,
      title: "Song Removal Test Service",
      type: "regular",
      content: "Opening Hymn:\nHymn of the Day:\nSending Song:",
      elements: [
        { id: "1", type: "song_hymn", content: "Opening Hymn:" },
        { id: "2", type: "song_hymn", content: "Hymn of the Day:" },
        { id: "3", type: "song_hymn", content: "Sending Song:" }
      ],
      lastUpdated: new Date().toISOString()
    };
    
    await db.collection("serviceDetails").insertOne(initialService);
    console.log('✅ Initial service created');
    
    // Step 2: Add songs to all 3 slots
    console.log('\n🎵 Step 2: Adding songs to all 3 slots...');
    
    const allSongs = {
      song_0: {
        title: "Amazing Grace",
        type: "hymn", 
        number: "779",
        hymnal: "cranberry"
      },
      song_1: {
        title: "How Great Thou Art",
        type: "hymn",
        number: "532", 
        hymnal: "cranberry"
      },
      song_2: {
        title: "10,000 Reasons",
        type: "contemporary",
        author: "Matt Redman"
      }
    };
    
    const addSongsResponse = await fetch('http://localhost:3000/api/service-songs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: testDate,
        selections: allSongs,
        updatedBy: 'Test User'
      })
    });
    
    if (!addSongsResponse.ok) {
      throw new Error(`Failed to add songs: ${addSongsResponse.status}`);
    }
    
    console.log('✅ All 3 songs added successfully');
    
    // Verify all songs are present
    const afterAdd = await db.collection("serviceDetails").findOne({ date: testDate });
    const songsAfterAdd = afterAdd.elements.filter(e => e.selection?.title);
    console.log(`   📊 Songs in service: ${songsAfterAdd.length}/3`);
    
    // Step 3: Remove middle song (song_1) by sending empty object
    console.log('\n❌ Step 3: Removing middle song (Hymn of the Day)...');
    
    const withMiddleRemoved = {
      song_0: allSongs.song_0, // Keep first song
      song_1: {                // Clear middle song
        title: '',
        type: 'hymn',
        number: '',
        hymnal: '',
        author: '',
        sheetMusic: '',
        youtube: '',
        notes: ''
      },
      song_2: allSongs.song_2  // Keep last song
    };
    
    const removeMiddleResponse = await fetch('http://localhost:3000/api/service-songs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: testDate,
        selections: withMiddleRemoved,
        updatedBy: 'Test User'
      })
    });
    
    if (!removeMiddleResponse.ok) {
      throw new Error(`Failed to remove middle song: ${removeMiddleResponse.status}`);
    }
    
    console.log('✅ Middle song removal completed');
    
    // Verify middle song is gone but others remain
    const afterRemove = await db.collection("serviceDetails").findOne({ date: testDate });
    
    console.log('\n🔍 Verifying removal results:');
    afterRemove.elements.forEach((element, index) => {
      if (element.type === 'song_hymn') {
        if (element.selection?.title) {
          console.log(`   ✅ Position ${index}: ${element.selection.title} (KEPT)`);
        } else {
          console.log(`   📝 Position ${index}: ${element.content} (PENDING - cleared as expected)`);
        }
      }
    });
    
    const songsAfterRemove = afterRemove.elements.filter(e => e.selection?.title);
    console.log(`   📊 Songs remaining: ${songsAfterRemove.length}/3 (should be 2)`);
    
    // Step 4: Test that presentation team sees correct state
    console.log('\n👥 Step 4: Testing presentation team view...');
    
    // Check service-songs collection (what presentation team sees)
    const serviceSongs = await db.collection("service_songs").findOne({ date: testDate });
    if (serviceSongs) {
      const validSongs = Object.entries(serviceSongs.selections)
        .filter(([key, value]) => value && value.title)
        .length;
      console.log(`   📊 Valid songs in service-songs: ${validSongs}/3`);
      console.log(`   ${validSongs === 2 ? '✅' : '❌'} Presentation team sees correct number of songs`);
    }
    
    // Step 5: Test pastor edit preserves the partial state
    console.log('\n📝 Step 5: Testing pastor edit with partial songs...');
    
    const pastorEdit = {
      date: testDate,
      title: "Updated Service with Partial Songs",
      type: "regular",
      content: "Welcome\nOpening Hymn:\nReading\nHymn of the Day:\nSermon\nSending Song:",
      elements: [
        { id: "1", type: "liturgy", content: "Welcome" },
        { id: "2", type: "song_hymn", content: "Opening Hymn:" },
        { id: "3", type: "reading", content: "Reading", reference: "Psalm 23" },
        { id: "4", type: "song_hymn", content: "Hymn of the Day:" },
        { id: "5", type: "message", content: "Sermon" },
        { id: "6", type: "song_hymn", content: "Sending Song:" }
      ],
      lastUpdated: afterRemove.lastUpdated
    };
    
    const pastorResponse = await fetch('http://localhost:3000/api/service-details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pastorEdit)
    });
    
    if (!pastorResponse.ok) {
      throw new Error(`Pastor edit failed: ${pastorResponse.status}`);
    }
    
    console.log('✅ Pastor edit completed');
    
    // Verify partial song state is preserved
    const finalService = await db.collection("serviceDetails").findOne({ date: testDate });
    const finalSongs = finalService.elements.filter(e => e.type === 'song_hymn');
    const finalSongsWithSelection = finalSongs.filter(e => e.selection?.title);
    
    console.log('\n🔍 Final verification:');
    console.log(`   📊 Song slots after pastor edit: ${finalSongs.length}`);
    console.log(`   📊 Songs with selections: ${finalSongsWithSelection.length}`);
    console.log(`   📊 Pending songs: ${finalSongs.length - finalSongsWithSelection.length}`);
    
    // Final Results
    console.log('\n📊 SONG REMOVAL TEST RESULTS:');
    console.log('=====================================');
    
    const tests = [
      { name: 'Initial Song Addition', passed: songsAfterAdd.length === 3 },
      { name: 'Middle Song Removal', passed: songsAfterRemove.length === 2 },
      { name: 'Presentation Team View', passed: serviceSongs && Object.entries(serviceSongs.selections).filter(([k,v]) => v?.title).length === 2 },
      { name: 'Pastor Edit Preservation', passed: finalSongsWithSelection.length === 2 },
      { name: 'Pending Slot Maintained', passed: finalSongs.length > finalSongsWithSelection.length }
    ];
    
    const passedTests = tests.filter(t => t.passed).length;
    
    tests.forEach(test => {
      console.log(`   ${test.passed ? '✅' : '❌'} ${test.name}: ${test.passed ? 'PASSED' : 'FAILED'}`);
    });
    
    console.log(`\n🎯 Overall Result: ${passedTests}/${tests.length} tests passed`);
    
    if (passedTests === tests.length) {
      console.log('🎉 SUCCESS: Song removal feature works perfectly!');
      console.log('   ✅ Songs can be cleared to pending state');
      console.log('   ✅ Other songs remain unaffected');
      console.log('   ✅ Presentation team sees correct state');
      console.log('   ✅ Phase 4C merge logic handles partial state');
      console.log('   ✅ All robustness features maintained');
    } else {
      console.log('❌ FAILURE: Song removal has issues');
    }
    
    return passedTests === tests.length;
    
  } catch (error) {
    console.error('❌ Song removal test failed:', error);
    return false;
  } finally {
    await client.close();
  }
}

// Run the song removal test
testSongRemoval().catch(console.error);
