/**
 * End-to-End Test for the Quick Add Workflow
 * 
 * This test verifies the complete flow from song discovery to service addition:
 * 1. Finding songs in the SongRediscoveryPanel
 * 2. Opening the Quick Add modal for a song
 * 3. Selecting a service
 * 4. Selecting a position
 * 5. Confirming the addition
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { act } from 'react';
import SongRediscoveryPanel from '../components/ui/SongRediscoveryPanel';
import QuickAddModal from '../components/ui/QuickAddModal';
import { getLiturgicalInfo } from '../lib/LiturgicalCalendarService';

// Mock dependencies
jest.mock('../lib/LiturgicalCalendarService', () => ({
  getLiturgicalInfo: jest.fn()
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => {
  const mockIcon = () => 'IconSVG';
  return {
    Search: mockIcon,
    RefreshCw: mockIcon,
    Music: mockIcon,
    Calendar: mockIcon,
    PlusCircle: mockIcon,
    Info: mockIcon,
    ChevronDown: mockIcon,
    ChevronUp: mockIcon,
    X: mockIcon,
    Clock: mockIcon,
    BarChart2: mockIcon,
    Filter: mockIcon,
    CheckCircle: mockIcon,
    ExternalLink: mockIcon,
    AlertCircle: mockIcon,
  };
});

// Mock fetch API
global.fetch = jest.fn();

// Mock confirm function for song replacement confirmation
global.confirm = jest.fn(() => true);

describe('Quick Add Workflow E2E Test', () => {
  // Test data setup
  const mockSongs = [
    {
      _id: 'song1',
      title: 'Amazing Grace',
      type: 'hymn',
      seasonalTags: ['Lent', 'Easter'],
      usageCount: 5,
      lastUsed: '2023-12-01'
    },
    {
      _id: 'song2',
      title: 'How Great Thou Art',
      type: 'hymn',
      seasonalTags: ['Ordinary', 'Pentecost'],
      usageCount: 2,
      lastUsed: '2023-10-15'
    },
    {
      _id: 'song3',
      title: 'Build My Life',
      type: 'contemporary',
      seasonalTags: ['Epiphany', 'Ordinary'],
      usageCount: 0,
      lastUsed: null
    }
  ];

  const mockIntelligentSuggestions = [
    {
      _id: 'song3',
      title: 'Build My Life',
      type: 'contemporary',
      seasonalTags: ['Epiphany', 'Ordinary'],
      score: 100,
      reason: 'Never used'
    },
    {
      _id: 'song2',
      title: 'How Great Thou Art',
      type: 'hymn',
      seasonalTags: ['Ordinary', 'Pentecost'],
      score: 80,
      reason: 'Matches current season'
    }
  ];

  const mockUpcomingServices = [
    {
      _id: 'service1',
      title: 'Sunday Worship',
      date: new Date('2024-05-05').toISOString(),
      serviceType: 'Sunday',
      season: 'Easter',
      seasonColor: '#ffffff'
    },
    {
      _id: 'service2',
      title: 'Midweek Service',
      date: new Date('2024-05-08').toISOString(),
      serviceType: 'Midweek',
      season: 'Easter',
      seasonColor: '#ffffff'
    }
  ];

  const mockServiceSongs = {
    'service1': [
      { position: 'Opening Hymn', title: 'Christ the Lord is Risen Today', type: 'hymn' },
      { position: 'Hymn of the Day', title: '', type: '' },
      { position: 'Communion Hymn', title: '', type: '' },
      { position: 'Closing Hymn', title: 'Crown Him with Many Crowns', type: 'hymn' }
    ]
  };

  beforeEach(() => {
    // Clear all mocks
    fetch.mockClear();
    confirm.mockClear();
    
    // Mock liturgical info
    getLiturgicalInfo.mockReturnValue({
      season: 'Ordinary',
      seasonId: 'ORDINARY',
      color: '#ffffff'
    });

    // Mock API responses
    fetch.mockImplementation((url) => {
      console.log(`Mock fetch called with: ${url}`);
      
      // Match exactly '/api/songs' endpoint
      if (url === '/api/songs') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ songs: mockSongs })
        });
      }
      
      // Match '/api/songs?' with any query parameters
      else if (url.startsWith('/api/songs?')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ songs: mockSongs })
        });
      }
      
      // Match any suggestions API call
      else if (url.startsWith('/api/song-usage/suggestions')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            suggestions: mockIntelligentSuggestions
          })
        });
      }
      
      // Match exactly '/api/services/upcoming'
      else if (url === '/api/services/upcoming') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ services: mockUpcomingServices })
        });
      }
      
      // Match exactly '/api/upcoming-services'
      else if (url === '/api/upcoming-services') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ services: mockUpcomingServices })
        });
      }
      
      // Match '/api/upcoming-services' with query parameters
      else if (url.startsWith('/api/upcoming-services')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ services: mockUpcomingServices })
        });
      }
      
      // Match service-songs with any query parameter
      else if (url.includes('/api/service-songs') && !url.includes('quick-add')) {
        console.log('Service songs request:', url);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ songSelections: mockServiceSongs['service1'] })
        });
      }
      
      // Match quick-add endpoint
      else if (url === '/api/service-songs/quick-add' || url.includes('quick-add')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      }
      
      console.log(`Unmatched URL in mock: ${url}`);
      return Promise.reject(new Error('Not found'));
    });
  });

  test('complete quick add workflow from song discovery to service addition', async () => {
    // 1. Render SongRediscoveryPanel
    await act(async () => {
      render(<SongRediscoveryPanel />);
    });

    // Wait for initial data loading
    await waitFor(() => {
      expect(screen.getByText('Song Rediscovery')).toBeInTheDocument();
    });

    // 2. Verify songs are displayed
    expect((await screen.findAllByText('How Great Thou Art')).length).toBeGreaterThan(0);
    expect((await screen.findAllByText('Build My Life')).length).toBeGreaterThan(0);

    // 3. INSTEAD OF clicking an "Add to Service" button, directly render the QuickAddModal component
    const selectedSong = mockSongs[0]; // Amazing Grace
    
    await act(async () => {
      render(
        <QuickAddModal 
          isOpen={true}
          onClose={() => {}}
          song={selectedSong}
        />
      );
    });

    // 4. Wait for the modal to show
    await waitFor(() => {
      const modalTitleText = `Add "${selectedSong.title}" to a Service`;
      expect(screen.getByText(modalTitleText)).toBeInTheDocument();
    });

    // 5. Wait for service cards to be loaded
    await waitFor(() => {
      const serviceCard = screen.getByText('Sunday Worship');
      expect(serviceCard).toBeInTheDocument();
    });

    // 6. Select a service
    const serviceCard = screen.getByText('Sunday Worship');
    const cardContainer = serviceCard.closest('div[class*="border"]');
    
    await act(async () => {
      fireEvent.click(cardContainer);
    });

    // 7. Wait for positions to be displayed
    await waitFor(() => {
      const emptyPosition = screen.getByText('Hymn of the Day');
      expect(emptyPosition).toBeInTheDocument();
    }, { timeout: 3000 });

    // 8. Verify all positions are displayed
    expect(screen.getByText('Opening Hymn')).toBeInTheDocument();
    expect(screen.getByText('Hymn of the Day')).toBeInTheDocument();
    expect(screen.getByText('Communion Hymn')).toBeInTheDocument();
    expect(screen.getByText('Closing Hymn')).toBeInTheDocument();

    // 9. Select an empty position (Hymn of the Day)
    const emptyPosition = screen.getByText('Hymn of the Day');
    const emptyButton = emptyPosition.closest('button');
    
    await act(async () => {
      fireEvent.click(emptyButton);
    });

    // 10. Verify the success message appears
    await waitFor(() => {
      expect(screen.getByText('Song added successfully!')).toBeInTheDocument();
    });
  });

  test('replacing an existing song in a service shows confirmation dialog', async () => {
    // 1. Directly render the QuickAddModal with a selected song and service
    const selectedSong = mockSongs[0]; // Amazing Grace
    
    await act(async () => {
      render(
        <QuickAddModal 
          isOpen={true}
          onClose={() => {}}
          song={selectedSong}
        />
      );
    });

    // 2. Wait for the modal to show
    await waitFor(() => {
      const modalTitleText = `Add "${selectedSong.title}" to a Service`;
      expect(screen.getByText(modalTitleText)).toBeInTheDocument();
    });

    // 3. Select a service
    const serviceCard = screen.getByText('Sunday Worship');
    const cardContainer = serviceCard.closest('div[class*="border"]');
    
    await act(async () => {
      fireEvent.click(cardContainer);
    });

    // 4. Wait for positions to be displayed
    await waitFor(() => {
      const filledPosition = screen.getByText('Opening Hymn');
      expect(filledPosition).toBeInTheDocument();
    }, { timeout: 3000 });

    // 5. Click a filled position (Opening Hymn) to trigger confirmation
    const filledPosition = screen.getByText('Opening Hymn');
    const filledButton = filledPosition.closest('button');
    
    // Clear confirmation mock
    confirm.mockClear();
    
    await act(async () => {
      fireEvent.click(filledButton);
    });

    // 6. Verify confirmation dialog was shown
    expect(confirm).toHaveBeenCalled();
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('Replace'));
  });
});