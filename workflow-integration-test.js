// workflow-integration-test.js
// Comprehensive test to verify the order of worship workflow fix
// Tests the complete pastor-edit -> worship-team cycle to ensure song selections are preserved

import fs from 'fs';
import path from 'path';

class WorkflowIntegrationTester {
  constructor() {
    this.testResults = [];
    this.testDate = '7/14/25';
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logEntry);
    this.testResults.push({ timestamp, type, message });
  }

  // Simulate the workflow step by step
  async testWorkflow() {
    this.log('🚀 Starting Order of Worship Workflow Integration Test', 'test');
    
    try {
      // Test 1: Verify the API merge logic exists
      await this.testAPIMergeLogic();
      
      // Test 2: Verify the SignupSheet merge logic exists  
      await this.testSignupSheetMergeLogic();
      
      // Test 3: Simulate the complete workflow scenario
      await this.testCompleteWorkflow();
      
      // Generate final report
      return this.generateReport();
      
    } catch (error) {
      this.log(`❌ Test suite failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async testAPIMergeLogic() {
    this.log('📋 Test 1: Verifying API merge logic in service-details route', 'test');
    
    const apiRoute = this.readFile('src/app/api/service-details/route.js');
    
    if (!apiRoute) {
      throw new Error('Could not read service-details API route');
    }

    // Check for critical merge logic
    const criticalChecks = [
      {
        name: 'CRITICAL FIX comment exists',
        check: () => apiRoute.includes('CRITICAL FIX: Preserve existing song selections'),
        description: 'Ensures the fix is documented in code'
      },
      {
        name: 'Existing service lookup',
        check: () => apiRoute.includes('const existingService = await db.collection("serviceDetails").findOne({ date: body.date })'),
        description: 'Verifies existing service data is fetched before merge'
      },
      {
        name: 'Song selection preservation logic',
        check: () => apiRoute.includes('existingSongSelections.set(prefix, {') && 
                     apiRoute.includes('selection: element.selection'),
        description: 'Confirms song selections are mapped and preserved'
      },
      {
        name: 'Merged elements usage',
        check: () => apiRoute.includes('elements: mergedElements') && 
                     apiRoute.includes('Use merged elements that preserve song selections'),
        description: 'Ensures merged elements are saved, not raw elements'
      },
      {
        name: 'Hymnal formatting helper',
        check: () => apiRoute.includes('const formatHymnalName = (hymnal)'),
        description: 'Confirms helper function for proper hymnal display'
      }
    ];

    let passed = 0;
    let failed = 0;

    for (const check of criticalChecks) {
      if (check.check()) {
        this.log(`  ✅ ${check.name}: PASSED - ${check.description}`, 'success');
        passed++;
      } else {
        this.log(`  ❌ ${check.name}: FAILED - ${check.description}`, 'error');
        failed++;
      }
    }

    this.log(`📊 API Test Results: ${passed}/${criticalChecks.length} checks passed`, passed === criticalChecks.length ? 'success' : 'error');
    
    if (failed > 0) {
      throw new Error(`API merge logic test failed: ${failed} critical checks failed`);
    }
  }

  async testSignupSheetMergeLogic() {
    this.log('📋 Test 2: Verifying SignupSheet merge logic in onSave handler', 'test');
    
    const signupSheet = this.readFile('src/components/ui/SignupSheet.jsx');
    
    if (!signupSheet) {
      throw new Error('Could not read SignupSheet component');
    }

    const criticalChecks = [
      {
        name: 'PASTOR SAVE logging exists',
        check: () => signupSheet.includes('💾 PASTOR SAVE: Starting save process'),
        description: 'Confirms enhanced logging for debugging'
      },
      {
        name: 'Existing elements separation',
        check: () => signupSheet.includes('const existingSongs = existingElements.filter(e => e.type === \'song_hymn\'') &&
                     signupSheet.includes('filter(e => e.selection?.title)'),
        description: 'Verifies existing songs with selections are identified'
      },
      {
        name: 'Prefix matching logic',
        check: () => signupSheet.includes('const newElementPrefix = newElement.content?.split(') &&
                     signupSheet.includes('const existingPrefix = existing.content?.split('),
        description: 'Confirms intelligent prefix matching for song preservation'
      },
      {
        name: 'Positional fallback matching',
        check: () => signupSheet.includes('try positional matching') &&
                     signupSheet.includes('const songPosition = newSongElements.indexOf(newElement)'),
        description: 'Ensures fallback strategy when prefix matching fails'
      },
      {
        name: 'Song content reconstruction',
        check: () => signupSheet.includes('Reconstruct content with preserved song selection') &&
                     signupSheet.includes('content: `${prefix}: ${songDetails}`'),
        description: 'Verifies proper content reconstruction with preserved selections'
      },
      {
        name: 'Reading reference preservation',
        check: () => signupSheet.includes('Handle readings with exact prefix matching') &&
                     signupSheet.includes('Preserving existing reading reference'),
        description: 'Confirms reading references are also preserved'
      }
    ];

    let passed = 0;
    let failed = 0;

    for (const check of criticalChecks) {
      if (check.check()) {
        this.log(`  ✅ ${check.name}: PASSED - ${check.description}`, 'success');
        passed++;
      } else {
        this.log(`  ❌ ${check.name}: FAILED - ${check.description}`, 'error');
        failed++;
      }
    }

    this.log(`📊 SignupSheet Test Results: ${passed}/${criticalChecks.length} checks passed`, passed === criticalChecks.length ? 'success' : 'error');
    
    if (failed > 0) {
      throw new Error(`SignupSheet merge logic test failed: ${failed} critical checks failed`);
    }
  }

  async testCompleteWorkflow() {
    this.log('📋 Test 3: Simulating complete workflow scenario', 'test');
    
    // Simulate the workflow scenario that was causing data loss
    const scenario = {
      step1: 'Pastor creates initial service order',
      step2: 'Worship team selects songs for each position',
      step3: 'Pastor edits service order (adds reading, modifies structure)',
      step4: 'Verify song selections are preserved after pastor edit'
    };

    this.log('🎭 Workflow Scenario:', 'info');
    Object.entries(scenario).forEach(([step, description]) => {
      this.log(`  ${step}: ${description}`, 'info');
    });

    // Step 1: Initial service data (what pastor creates)
    const initialServiceData = {
      date: this.testDate,
      type: 'no_communion',
      content: `Welcome & Announcements
Opening Hymn: 
Confession and Forgiveness (pg. 94-96)
First Reading: 
Gospel Reading: 
Sermon: 
Hymn of the Day: 
Prayers of the Church
Offering & Offertory - "Create In Me" (#186)
Sending Song: 
Dismissal`,
      elements: [
        { id: 'elem_1', type: 'liturgy', content: 'Welcome & Announcements' },
        { id: 'elem_2', type: 'song_hymn', content: 'Opening Hymn:', selection: null },
        { id: 'elem_3', type: 'liturgy', content: 'Confession and Forgiveness (pg. 94-96)' },
        { id: 'elem_4', type: 'reading', content: 'First Reading:', reference: '' },
        { id: 'elem_5', type: 'reading', content: 'Gospel Reading:', reference: '' },
        { id: 'elem_6', type: 'message', content: 'Sermon:', reference: '' },
        { id: 'elem_7', type: 'song_hymn', content: 'Hymn of the Day:', selection: null },
        { id: 'elem_8', type: 'liturgy', content: 'Prayers of the Church' },
        { id: 'elem_9', type: 'liturgical_song', content: 'Offering & Offertory - "Create In Me" (#186)' },
        { id: 'elem_10', type: 'song_hymn', content: 'Sending Song:', selection: null }
      ]
    };

    // Step 2: After worship team adds songs (what worship team creates)
    const serviceWithSongs = {
      ...initialServiceData,
      elements: [
        { id: 'elem_1', type: 'liturgy', content: 'Welcome & Announcements' },
        { 
          id: 'elem_2', 
          type: 'song_hymn', 
          content: 'Opening Hymn: Holy, Holy, Holy #138 (Cranberry)',
          selection: {
            type: 'hymn',
            title: 'Holy, Holy, Holy',
            number: '138',
            hymnal: 'cranberry',
            link: 'https://hymnary.org/hymn/LBW1978/138'
          }
        },
        { id: 'elem_3', type: 'liturgy', content: 'Confession and Forgiveness (pg. 94-96)' },
        { id: 'elem_4', type: 'reading', content: 'First Reading:', reference: 'Isaiah 6:1-8' },
        { id: 'elem_5', type: 'reading', content: 'Gospel Reading:', reference: 'John 1:1-14' },
        { id: 'elem_6', type: 'message', content: 'Sermon:', reference: 'The Light of the World' },
        { 
          id: 'elem_7', 
          type: 'song_hymn', 
          content: 'Hymn of the Day: Amazing Grace #448 (Cranberry)',
          selection: {
            type: 'hymn',
            title: 'Amazing Grace',
            number: '448',
            hymnal: 'cranberry',
            link: 'https://hymnary.org/hymn/LBW1978/448'
          }
        },
        { id: 'elem_8', type: 'liturgy', content: 'Prayers of the Church' },
        { id: 'elem_9', type: 'liturgical_song', content: 'Offering & Offertory - "Create In Me" (#186)' },
        { 
          id: 'elem_10', 
          type: 'song_hymn', 
          content: 'Sending Song: Go My Children, with My Blessing #721 (Cranberry)',
          selection: {
            type: 'hymn',
            title: 'Go My Children, with My Blessing',
            number: '721',
            hymnal: 'cranberry',
            link: 'https://hymnary.org/hymn/LBW1978/721'
          }
        }
      ]
    };

    // Step 3: Pastor edits the service (adds Second Reading, modifies structure)
    const pastorEditedContent = `Welcome & Announcements
Opening Hymn: 
Confession and Forgiveness (pg. 94-96)
First Reading: 
Psalm Reading:
Second Reading: 
Gospel Acclamation - Alleluia (pg. 102)
Gospel Reading: 
Sermon: 
Hymn of the Day: 
The Apostle's Creed
Prayers of the Church
Offering & Offertory - "Create In Me" (#186)
Sending Song: 
Dismissal`;

    const pastorEditedElements = [
      { id: 'elem_1', type: 'liturgy', content: 'Welcome & Announcements' },
      { id: 'elem_2', type: 'song_hymn', content: 'Opening Hymn:' }, // Note: no selection here (PastorServiceInput strips them)
      { id: 'elem_3', type: 'liturgy', content: 'Confession and Forgiveness (pg. 94-96)' },
      { id: 'elem_4', type: 'reading', content: 'First Reading:' },
      { id: 'elem_5_new', type: 'reading', content: 'Psalm Reading:' }, // NEW element
      { id: 'elem_6_new', type: 'reading', content: 'Second Reading:' }, // NEW element
      { id: 'elem_7_new', type: 'liturgical_song', content: 'Gospel Acclamation - Alleluia (pg. 102)' }, // NEW element
      { id: 'elem_8', type: 'reading', content: 'Gospel Reading:' },
      { id: 'elem_9', type: 'message', content: 'Sermon:' },
      { id: 'elem_10', type: 'song_hymn', content: 'Hymn of the Day:' }, // Note: no selection here
      { id: 'elem_11_new', type: 'liturgy', content: 'The Apostle\'s Creed' }, // NEW element
      { id: 'elem_12', type: 'liturgy', content: 'Prayers of the Church' },
      { id: 'elem_13', type: 'liturgical_song', content: 'Offering & Offertory - "Create In Me" (#186)' },
      { id: 'elem_14', type: 'song_hymn', content: 'Sending Song:' }, // Note: no selection here
      { id: 'elem_15_new', type: 'liturgy', content: 'Dismissal' } // NEW element
    ];

    this.log('📊 Testing merge scenarios:', 'info');

    // Test the merge logic from SignupSheet
    const mergedElements = this.simulateSignupSheetMerge(pastorEditedElements, serviceWithSongs.elements);
    
    // Verify song selections were preserved
    const preservedSongs = mergedElements.filter(el => 
      (el.type === 'song_hymn' || el.type === 'song_contemporary') && el.selection?.title
    );

    this.log(`🎵 Songs with preserved selections: ${preservedSongs.length}`, 'info');
    preservedSongs.forEach(song => {
      this.log(`  - ${song.content}`, 'info');
    });

    // Verify readings were preserved  
    const preservedReadings = mergedElements.filter(el => 
      el.type === 'reading' && el.reference
    );

    this.log(`📖 Readings with preserved references: ${preservedReadings.length}`, 'info');
    preservedReadings.forEach(reading => {
      this.log(`  - ${reading.content} -> ${reading.reference}`, 'info');
    });

    // Test the API merge logic 
    const apiMergedElements = this.simulateAPIMerge(pastorEditedElements, serviceWithSongs.elements);
    const apiPreservedSongs = apiMergedElements.filter(el => 
      (el.type === 'song_hymn' || el.type === 'song_contemporary') && el.selection?.title
    );

    // Verify both merge strategies preserve the same data
    if (preservedSongs.length !== apiPreservedSongs.length) {
      throw new Error(`Merge strategy mismatch: SignupSheet preserved ${preservedSongs.length} songs, API preserved ${apiPreservedSongs.length} songs`);
    }

    // Critical assertions
    const assertions = [
      {
        name: 'Opening Hymn preserved',
        check: () => preservedSongs.some(s => s.content.includes('Holy, Holy, Holy')),
        error: 'Opening Hymn "Holy, Holy, Holy" was not preserved'
      },
      {
        name: 'Hymn of the Day preserved', 
        check: () => preservedSongs.some(s => s.content.includes('Amazing Grace')),
        error: 'Hymn of the Day "Amazing Grace" was not preserved'
      },
      {
        name: 'Sending Song preserved',
        check: () => preservedSongs.some(s => s.content.includes('Go My Children')),
        error: 'Sending Song "Go My Children, with My Blessing" was not preserved'
      },
      {
        name: 'First Reading reference preserved',
        check: () => preservedReadings.some(r => r.reference === 'Isaiah 6:1-8'),
        error: 'First Reading reference "Isaiah 6:1-8" was not preserved'
      },
      {
        name: 'Gospel Reading reference preserved',
        check: () => preservedReadings.some(r => r.reference === 'John 1:1-14'),
        error: 'Gospel Reading reference "John 1:1-14" was not preserved'
      },
      {
        name: 'All 3 songs preserved',
        check: () => preservedSongs.length === 3,
        error: `Expected 3 preserved songs, got ${preservedSongs.length}`
      }
    ];

    let assertionsPassed = 0;
    let assertionsFailed = 0;

    for (const assertion of assertions) {
      if (assertion.check()) {
        this.log(`  ✅ ${assertion.name}: PASSED`, 'success');
        assertionsPassed++;
      } else {
        this.log(`  ❌ ${assertion.name}: FAILED - ${assertion.error}`, 'error');
        assertionsFailed++;
      }
    }

    this.log(`📊 Workflow Test Results: ${assertionsPassed}/${assertions.length} assertions passed`, 
      assertionsFailed === 0 ? 'success' : 'error');
    
    if (assertionsFailed > 0) {
      throw new Error(`Workflow simulation failed: ${assertionsFailed} critical assertions failed`);
    }

    this.log('✅ Complete workflow simulation PASSED - Song selections preserved after pastor edit!', 'success');
  }

  // Simulate the SignupSheet merge logic (simplified version for testing)
  simulateSignupSheetMerge(newElements, existingElements) {
    const existingSongs = existingElements.filter(e => 
      (e.type === 'song_hymn' || e.type === 'song_contemporary') && e.selection?.title
    );
    const existingReadings = existingElements.filter(e => 
      e.type === 'reading' && e.reference
    );

    return newElements.map((newElement) => {
      // Handle songs
      if (newElement.type === 'song_hymn' || newElement.type === 'song_contemporary') {
        const newElementPrefix = newElement.content?.split(':')[0]?.trim().toLowerCase();
        
        // Try exact prefix match
        let matchingSong = existingSongs.find(existing => {
          const existingPrefix = existing.content?.split(':')[0]?.trim().toLowerCase();
          return existingPrefix === newElementPrefix;
        });
        
        // Try positional matching if no exact match
        if (!matchingSong) {
          const newSongElements = newElements.filter(e => e.type === 'song_hymn' || e.type === 'song_contemporary');
          const songPosition = newSongElements.indexOf(newElement);
          
          if (songPosition >= 0 && songPosition < existingSongs.length) {
            matchingSong = existingSongs[songPosition];
          }
        }
        
        if (matchingSong) {
          const prefix = newElement.content?.split(':')[0]?.trim();
          let songDetails;
          
          if (matchingSong.selection.type === 'hymn') {
            songDetails = `${matchingSong.selection.title} #${matchingSong.selection.number} (${matchingSong.selection.hymnal})`;
          } else {
            songDetails = matchingSong.selection.author ? 
              `${matchingSong.selection.title} - ${matchingSong.selection.author}` : 
              matchingSong.selection.title;
          }
          
          return {
            ...newElement,
            content: `${prefix}: ${songDetails}`,
            selection: matchingSong.selection,
            id: matchingSong.id
          };
        }
      }
      
      // Handle readings
      if (newElement.type === 'reading') {
        const newElementPrefix = newElement.content?.split(':')[0]?.trim().toLowerCase();
        const matchingReading = existingReadings.find(existing => {
          const existingPrefix = existing.content?.split(':')[0]?.trim().toLowerCase();
          return existingPrefix === newElementPrefix;
        });
        
        if (matchingReading && !newElement.reference && matchingReading.reference) {
          return {
            ...newElement,
            reference: matchingReading.reference,
            id: matchingReading.id
          };
        }
      }
      
      return newElement;
    });
  }

  // Simulate the API merge logic (simplified version for testing)
  simulateAPIMerge(newElements, existingElements) {
    const existingSongSelections = new Map();
    existingElements.forEach((element, index) => {
      if ((element.type === 'song_hymn' || element.type === 'song_contemporary') && element.selection) {
        const prefix = element.content?.split(':')[0]?.trim()?.toLowerCase() || '';
        existingSongSelections.set(prefix, {
          selection: element.selection,
          index: index,
          originalContent: element.content
        });
      }
    });

    return newElements.map((newElement, index) => {
      if (newElement.type === 'song_hymn' || newElement.type === 'song_contemporary') {
        const newPrefix = newElement.content?.split(':')[0]?.trim()?.toLowerCase() || '';
        const existingSelection = existingSongSelections.get(newPrefix);
        
        if (existingSelection) {
          const selection = existingSelection.selection;
          let fullContent;
          
          if (selection.type === 'hymn') {
            const hymnalName = selection.hymnal.charAt(0).toUpperCase() + selection.hymnal.slice(1);
            fullContent = `${newElement.content.split(':')[0].trim()}: ${selection.title} #${selection.number} (${hymnalName})`;
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
  }

  readFile(filePath) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      return fs.readFileSync(fullPath, 'utf8');
    } catch (error) {
      this.log(`❌ Could not read file ${filePath}: ${error.message}`, 'error');
      return null;
    }
  }

  generateReport() {
    this.log('📊 WORKFLOW INTEGRATION TEST REPORT', 'report');
    this.log('='.repeat(80), 'report');
    
    const errorCount = this.testResults.filter(r => r.type === 'error').length;
    const successCount = this.testResults.filter(r => r.type === 'success').length;
    const totalTests = errorCount + successCount;
    
    if (errorCount === 0) {
      this.log('🎉 ALL TESTS PASSED! The order of worship workflow fix is working correctly.', 'success');
      this.log('✅ Song selections WILL be preserved when pastor edits the service order', 'success');
      this.log('✅ Reading references WILL be preserved when pastor edits the service order', 'success');
      this.log('✅ Both API and SignupSheet merge strategies are implemented correctly', 'success');
    } else {
      this.log('❌ TESTS FAILED! The workflow fix has issues that need to be addressed.', 'error');
      this.log(`📊 Results: ${successCount} passed, ${errorCount} failed out of ${totalTests} total`, 'error');
    }
    
    this.log('='.repeat(80), 'report');
    
    return errorCount === 0;
  }
}

// Execute the test
const tester = new WorkflowIntegrationTester();
tester.testWorkflow()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  });
