/**
 * Test Script: Verify Cross-Team Song Mapping Fix
 * 
 * This script tests the critical fix for song order mapping between
 * worship team saves and presentation team display.
 */

import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://theglow000:Urbane36$@zionsignupsheet.gt7uf.mongodb.net/?retryWrites=true&w=majority&appName=ZionSignupSheet";

async function testSongMappingFix() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db("church");
    
    console.log('🧪 Testing Song Mapping Fix');
    console.log('============================\n');
    
    const testDate = '11/9/25';
    
    // Step 1: Clear existing data for clean test
    console.log('🧹 Step 1: Clearing existing test data...');
    await db.collection("service_songs").deleteOne({ date: testDate });
    
    // Step 2: Test the service-songs API with properly ordered songs
    console.log('🎵 Step 2: Testing worship team song save with correct order...');
    
    const songSelections = {
      song_0: {
        title: "What A Friend We Have in Jesus",
        type: "hymn", 
        number: "742",
        hymnal: "cranberry"
      },
      song_1: {
        title: "Morning Has Broken",
        type: "hymn",
        number: "556", 
        hymnal: "cranberry"
      },
      song_2: {
        title: "Jesus Loves Me",
        type: "hymn",
        number: "595",
        hymnal: "cranberry"
      }
    };
    
    // Simulate calling the service-songs API
    const response = await fetch('http://localhost:3000/api/service-songs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date: testDate,
        selections: songSelections,
        updatedBy: 'Test User'
      })
    });
    
    if (response.ok) {
      console.log('✅ Service-songs API call successful');
    } else {
      console.log(`❌ Service-songs API failed: ${response.status}`);
      const errorText = await response.text();
      console.log(`Error: ${errorText}`);
      return;
    }
    
    // Step 3: Check what's now in serviceDetails 
    console.log('\n🔍 Step 3: Checking serviceDetails after API call...');
    
    const serviceDetails = await db.collection("serviceDetails").findOne({ date: testDate });
    if (serviceDetails?.elements) {
      console.log(`📋 Service has ${serviceDetails.elements.length} elements:`);
      
      serviceDetails.elements.forEach((element, index) => {
        if (element.type === 'song_hymn') {
          console.log(`   Element ${index}: ${element.content}`);
          if (element.selection) {
            console.log(`     ✅ Selection: ${element.selection.title}${element.selection.number ? ` #${element.selection.number}` : ''}`);
          } else {
            console.log(`     ❌ Selection: NONE`);
          }
        }
      });
    }
    
    // Step 4: Verify the API returns correct data
    console.log('\n🔗 Step 4: Testing API response...');
    
    const apiResponse = await fetch(`http://localhost:3000/api/service-details`);
    if (apiResponse.ok) {
      const data = await apiResponse.json();
      const service = data.find(s => s.date === testDate);
      
      if (service) {
        console.log('📋 API returned service:');
        service.elements?.forEach((element, index) => {
          if (element.type === 'song_hymn') {
            console.log(`   ${element.content}`);
            if (element.selection) {
              console.log(`     API Selection: ${element.selection.title}${element.selection.number ? ` #${element.selection.number}` : ''}`);
            }
          }
        });
      }
    }
    
    // Step 5: Verify the correct mapping
    console.log('\n🎯 Step 5: Verification Results:');
    
    const expectedMappings = [
      { position: 'Opening Hymn', expected: 'What A Friend We Have in Jesus #742' },
      { position: 'Hymn of the Day', expected: 'Morning Has Broken #556' },
      { position: 'Sending Song', expected: 'Jesus Loves Me #595' }
    ];
    
    let mappingsCorrect = 0;
    
    if (serviceDetails?.elements) {
      let songIndex = 0;
      serviceDetails.elements.forEach((element) => {
        if (element.type === 'song_hymn' && element.selection) {
          const expected = expectedMappings[songIndex];
          const actual = `${element.selection.title} #${element.selection.number}`;
          
          if (actual === expected.expected) {
            console.log(`✅ ${expected.position}: CORRECT - ${actual}`);
            mappingsCorrect++;
          } else {
            console.log(`❌ ${expected.position}: WRONG - Expected "${expected.expected}", got "${actual}"`);
          }
          songIndex++;
        }
      });
    }
    
    console.log(`\n📊 Final Results: ${mappingsCorrect}/3 mappings correct`);
    
    if (mappingsCorrect === 3) {
      console.log('🎉 SUCCESS: Song mapping fix is working correctly!');
      console.log('   Worship team saves will now appear correctly in presentation team.');
    } else {
      console.log('❌ FAILURE: Song mapping is still incorrect.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await client.close();
  }
}

// Run the test
testSongMappingFix().catch(console.error);
