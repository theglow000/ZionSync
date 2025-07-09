/**
 * Quick Test: Trigger Refresh Event
 * This simulates what happens when worship team saves songs
 */

console.log('🔄 Simulating worship team song save...');

// Trigger the refresh event that should update all teams
window.dispatchEvent(new CustomEvent('refreshServiceDetails'));

console.log('✅ Refresh event dispatched - all teams should update now');
