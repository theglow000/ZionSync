/**
 * Comprehensive Integration Test: Phase 4 + Cross-Team Fix
 * 
 * This test verifies that the cross-team song mapping fix does not
 * interfere with the Phase 4C robustness improvements, specifically:
 * - Optimistic concurrency control
 * - Enhanced merge logic 
 * - Song selection preservation during pastor edits
 * - Reading reference preservation
 */

import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://theglow000:Urbane36$@zionsignupsheet.gt7uf.mongodb.net/?retryWrites=true&w=majority&appName=ZionSignupSheet";

async function testPhase4Integration() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db("church");
    
    console.log('🧪 Comprehensive Integration Test: Phase 4 + Cross-Team Fix');
    console.log('===============================================================\n');
    
    const testDate = '7/15/25';
    
    // Clean slate
    await db.collection("serviceDetails").deleteOne({ date: testDate });
    await db.collection("service_songs").deleteOne({ date: testDate });
    
    // Step 1: Pastor creates initial service (via service-details API)
    console.log('📝 Step 1: Pastor creates initial service with order of worship...');
    
    const initialService = {
      date: testDate,
      title: "Integration Test Service",
      type: "communion",
      content: "Opening Hymn:\nHymn of the Day:\nSending Song:",
      elements: [
        { id: "1", type: "song_hymn", content: "Opening Hymn:" },
        { id: "2", type: "song_hymn", content: "Hymn of the Day:" },
        { id: "3", type: "song_hymn", content: "Sending Song:" }
      ],
      lastUpdated: new Date('2025-07-09T20:00:00.000Z').toISOString()
    };
    
    await db.collection("serviceDetails").insertOne(initialService);
    console.log('✅ Initial service created with lastUpdated timestamp');
    
    // Step 2: Worship team saves songs (via service-songs API with correct ordering)
    console.log('\n🎵 Step 2: Worship team saves songs via service-songs API...');
    
    const songSelections = {
      song_0: {
        title: "A Mighty Fortress Is Our God",
        type: "hymn",
        number: "504",
        hymnal: "cranberry"
      },
      song_1: {
        title: "How Great Thou Art", 
        type: "hymn",
        number: "532",
        hymnal: "cranberry"
      },
      song_2: {
        title: "Blessed Be Your Name",
        type: "contemporary",
        author: "Matt Redman"
      }
    };
    
    const serviceSongsResponse = await fetch('http://localhost:3000/api/service-songs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: testDate,
        selections: songSelections,
        updatedBy: 'Integration Test User'
      })
    });
    
    if (!serviceSongsResponse.ok) {
      throw new Error(`Service-songs API failed: ${serviceSongsResponse.status}`);
    }
    
    console.log('✅ Songs saved via service-songs API');
    
    // Verify correct song order mapping
    const afterSongs = await db.collection("serviceDetails").findOne({ date: testDate });
    console.log('\n🔍 Verifying song order mapping:');
    let songOrderCorrect = true;
    
    const expectedSongs = [
      "A Mighty Fortress Is Our God #504",
      "How Great Thou Art #532", 
      "Blessed Be Your Name"
    ];
    
    afterSongs.elements.forEach((element, index) => {
      if (element.type === 'song_hymn' && element.selection) {
        const actualSong = element.selection.author ? 
          `${element.selection.title}` : 
          `${element.selection.title} #${element.selection.number}`;
        
        if (actualSong === expectedSongs[index]) {
          console.log(`   ✅ Position ${index}: ${actualSong} (CORRECT)`);
        } else {
          console.log(`   ❌ Position ${index}: Expected "${expectedSongs[index]}", got "${actualSong}"`);
          songOrderCorrect = false;
        }
      }
    });
    
    // Step 3: Pastor edits service (tests Phase 4C merge logic)
    console.log('\n📝 Step 3: Pastor edits service order (testing Phase 4C merge logic)...');
    
    const pastorEdit = {
      date: testDate,
      title: "Integration Test Service - Updated",
      type: "communion",
      content: "Welcome & Announcements\nOpening Hymn:\nFirst Reading: Romans 8:31-39\nHymn of the Day:\nSermon\nSending Song:",
      elements: [
        { id: "1", type: "liturgy", content: "Welcome & Announcements" },
        { id: "2", type: "song_hymn", content: "Opening Hymn:" },
        { id: "3", type: "reading", content: "First Reading:", reference: "Romans 8:31-39" },
        { id: "4", type: "song_hymn", content: "Hymn of the Day:" },
        { id: "5", type: "message", content: "Sermon" },
        { id: "6", type: "song_hymn", content: "Sending Song:" }
      ],
      lastUpdated: afterSongs.lastUpdated // Use existing timestamp (no concurrency conflict)
    };
    
    const serviceDetailsResponse = await fetch('http://localhost:3000/api/service-details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pastorEdit)
    });
    
    if (!serviceDetailsResponse.ok) {
      throw new Error(`Service-details API failed: ${serviceDetailsResponse.status}`);
    }
    
    console.log('✅ Pastor edit completed');
    
    // Step 4: Verify Phase 4C merge logic preserved songs
    console.log('\n🔍 Step 4: Verifying Phase 4C merge logic preserved songs...');
    
    const finalService = await db.collection("serviceDetails").findOne({ date: testDate });
    const songsAfterEdit = finalService.elements.filter(e => e.type === 'song_hymn' && e.selection?.title);
    
    console.log(`📊 Songs preserved after pastor edit: ${songsAfterEdit.length}/3`);
    
    let mergeLogicWorking = true;
    songsAfterEdit.forEach((song, index) => {
      const expectedTitle = songSelections[`song_${index}`].title;
      if (song.selection.title === expectedTitle) {
        console.log(`   ✅ ${song.content} (PRESERVED)`);
      } else {
        console.log(`   ❌ Expected "${expectedTitle}", got "${song.selection.title}"`);
        mergeLogicWorking = false;
      }
    });
    
    // Step 5: Test concurrency conflict scenario
    console.log('\n⚠️  Step 5: Testing concurrency conflict detection...');
    
    const conflictEdit = {
      ...pastorEdit,
      title: "Conflict Test",
      lastUpdated: new Date('2025-07-09T19:00:00.000Z').toISOString() // Old timestamp
    };
    
    const conflictResponse = await fetch('http://localhost:3000/api/service-details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(conflictEdit)
    });
    
    console.log(conflictResponse.ok ? '✅ Concurrency conflict handled gracefully' : '❌ Concurrency test failed');
    
    // Final Results
    console.log('\n📊 INTEGRATION TEST RESULTS:');
    console.log('=====================================');
    
    const tests = [
      { name: 'Song Order Mapping', passed: songOrderCorrect },
      { name: 'Phase 4C Merge Logic', passed: mergeLogicWorking },
      { name: 'Pastor Edit Workflow', passed: songsAfterEdit.length === 3 },
      { name: 'Concurrency Handling', passed: conflictResponse.ok },
      { name: 'Service Structure', passed: finalService.elements.length === 6 }
    ];
    
    const passedTests = tests.filter(t => t.passed).length;
    
    tests.forEach(test => {
      console.log(`   ${test.passed ? '✅' : '❌'} ${test.name}: ${test.passed ? 'PASSED' : 'FAILED'}`);
    });
    
    console.log(`\n🎯 Overall Result: ${passedTests}/${tests.length} tests passed`);
    
    if (passedTests === tests.length) {
      console.log('🎉 SUCCESS: Cross-team fix works perfectly with Phase 4 improvements!');
      console.log('   ✅ Song order mapping is correct');
      console.log('   ✅ Phase 4C merge logic is preserved');
      console.log('   ✅ Concurrency control is intact');
      console.log('   ✅ All robustness features maintained');
    } else {
      console.log('❌ FAILURE: Integration issues detected');
    }
    
    return passedTests === tests.length;
    
  } catch (error) {
    console.error('❌ Integration test failed:', error);
    return false;
  } finally {
    await client.close();
  }
}

// Run the comprehensive integration test
testPhase4Integration().catch(console.error);
