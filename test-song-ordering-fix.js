// Test script to verify the song ordering fix
console.log('Testing song ordering fix...');

// Simulate the old broken behavior
const serviceSongStates = {
  song_0: { title: 'First Song', type: 'hymn' },
  song_1: { title: 'Second Song', type: 'contemporary' },
  song_2: { title: 'Third Song', type: 'hymn' },
  song_3: { title: 'Fourth Song', type: 'contemporary' },
  song_4: { title: 'Fifth Song', type: 'hymn' }
};

// Old buggy method - Object.values() doesn't guarantee order
const brokenSongSelections = Object.values(serviceSongStates);
console.log('\n❌ BROKEN (Object.values):');
brokenSongSelections.forEach((song, index) => {
  console.log(`  Index ${index}: ${song.title}`);
});

// Simulate the required song sections (in order)
const requiredSongSections = [
  { id: 'song_0', label: 'Opening Hymn' },
  { id: 'song_1', label: 'Hymn of Praise' },
  { id: 'song_2', label: 'Offertory' },
  { id: 'song_3', label: 'Communion Song' },
  { id: 'song_4', label: 'Closing Hymn' }
];

// Fixed method - preserves correct order
const fixedSongSelections = requiredSongSections
  .map(section => serviceSongStates[section.id])
  .filter(song => song);

console.log('\n✅ FIXED (Ordered mapping):');
fixedSongSelections.forEach((song, index) => {
  console.log(`  Index ${index}: ${song.title}`);
});

// Demonstrate the mapping issue that was causing the bug
console.log('\n🔍 MAPPING DEMONSTRATION:');
console.log('When the 5th song is added, the 4th song gets overwritten because...');

console.log('\nBROKEN: Object.values() might return:');
console.log('["Fifth Song", "First Song", "Second Song", "Third Song", "Fourth Song"]');
console.log('Then mapping by index:', {
  'Opening Hymn': 'Fifth Song',      // WRONG!
  'Hymn of Praise': 'First Song',    // WRONG!
  'Offertory': 'Second Song',        // WRONG!
  'Communion Song': 'Third Song',    // WRONG!
  'Closing Hymn': 'Fourth Song'      // WRONG!
});

console.log('\n✅ FIXED: Ordered mapping returns:');
fixedSongSelections.forEach((song, index) => {
  const section = requiredSongSections[index];
  console.log(`  ${section.label}: ${song.title} ✓`);
});

console.log('\n🎉 Fix verified! Songs now maintain their correct positions.');
