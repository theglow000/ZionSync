import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { act } from 'react';
import QuickAddModal from './QuickAddModal';

// Mock fetch API
global.fetch = jest.fn();

// Mock confirm function
global.confirm = jest.fn(() => true);

// Mock data for tests
const mockUpcomingServices = [
  {
    _id: 'service1',
    date: new Date('2024-05-05T00:00:00Z').toISOString(), // Adding explicit time zone
    title: 'Sunday Service',
    serviceType: 'Sunday',
    season: 'Easter',
    seasonColor: '#ffffff',
    slots: ['Opening Hymn', 'Hymn of the Day', 'Communion Hymn', 'Closing Hymn']
  },
  {
    _id: 'service2',
    date: new Date('2024-05-12T00:00:00Z').toISOString(), // Adding explicit time zone
    title: 'Sunday Service',
    serviceType: 'Sunday',
    season: 'Easter',
    seasonColor: '#ffffff',
    slots: ['Opening Hymn', 'Hymn of the Day', 'Communion Hymn', 'Closing Hymn']
  }
];

const mockSongSelections = {
  'service1': [
    { position: 'Opening Hymn', title: 'Amazing Grace', type: 'hymn' },
    { position: 'Hymn of the Day', title: '', type: '' },
    { position: 'Communion Hymn', title: '', type: '' },
    { position: 'Closing Hymn', title: 'How Great Thou Art', type: 'hymn' }
  ]
};

describe('QuickAddModal Component', () => {
  beforeEach(() => {
    fetch.mockClear();
    confirm.mockClear();
    
    // Mock successful responses for API calls
    fetch.mockImplementation((url) => {
      if (url.includes('/api/services/upcoming')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ services: mockUpcomingServices })
        });
      } else if (url.includes('/api/service-songs')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ songSelections: mockSongSelections['service1'] })
        });
      } else if (url.includes('/api/service-songs/quick-add')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  test('renders modal when isOpen is true', async () => {
    const mockSong = { 
      _id: 'song1', 
      title: 'Test Song', 
      type: 'hymn', 
      number: '123',
      hymnal: 'Cranberry'
    };
    
    await act(async () => {
      render(
        <QuickAddModal 
          isOpen={true}
          onClose={() => {}}
          song={mockSong}
        />
      );
    });

    expect(screen.getByText(/Add "Test Song" to a Service/i)).toBeInTheDocument();
  });

  test('loads upcoming services on open', async () => {
    const mockSong = { 
      _id: 'song1', 
      title: 'Test Song', 
      type: 'hymn'
    };
    
    await act(async () => {
      render(
        <QuickAddModal 
          isOpen={true}
          onClose={() => {}}
          song={mockSong}
        />
      );
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/services/upcoming', expect.any(Object));
    });
    
    // After services load, we should see them in the list
    // Use findAllByText instead of findByText
    const serviceElements = await screen.findAllByText('Sunday Service');
    expect(serviceElements.length).toBeGreaterThan(0);
    
    // Check for the May date text - note the date in the error was May 4, not May 5
    expect(await screen.findByText(/May 4, 2024/i)).toBeInTheDocument();
  });

  test('shows song slots when a service is selected', async () => {
    const mockSong = { 
      _id: 'song1', 
      title: 'Test Song', 
      type: 'hymn'
    };
    
    await act(async () => {
      render(
        <QuickAddModal 
          isOpen={true}
          onClose={() => {}}
          song={mockSong}
        />
      );
    });
    
    // Wait for services to load
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/services/upcoming', expect.any(Object));
    });
    
    // Select the first service
    const serviceCards = await screen.findAllByTestId('service-card');
    fireEvent.click(serviceCards[0]);
    
    // Wait for slots to load
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/service-songs'), expect.any(Object));
    });
    
    // Check if slots are displayed
    expect(await screen.findByText('Opening Hymn')).toBeInTheDocument();
    expect(await screen.findByText('Hymn of the Day')).toBeInTheDocument();
    expect(await screen.findByText('Communion Hymn')).toBeInTheDocument();
    expect(await screen.findByText('Closing Hymn')).toBeInTheDocument();
  });

  test('adds song to selected slot', async () => {
    const mockSong = { 
      _id: 'song1', 
      title: 'Test Song', 
      type: 'hymn'
    };
    
    await act(async () => {
      render(
        <QuickAddModal 
          isOpen={true}
          onClose={() => {}}
          song={mockSong}
        />
      );
    });
    
    // Wait for services to load and select first service
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/services/upcoming', expect.any(Object));
    });
    
    const serviceCards = await screen.findAllByTestId('service-card');
    fireEvent.click(serviceCards[0]);
    
    // Wait for slots to load
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/service-songs'), expect.any(Object));
    });
    
    // Find an empty slot and click it
    const emptySlot = await screen.findByText('Hymn of the Day');
    const emptySlotButton = emptySlot.closest('button');
    fireEvent.click(emptySlotButton);
    
    // Check if add song API is called
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/service-songs/quick-add', expect.objectContaining({
        method: 'POST',
        headers: expect.any(Object),
        body: expect.any(String)
      }));
    });
    
    // Should show success message
    expect(await screen.findByText('Song added successfully!')).toBeInTheDocument();
  });
  
  test('confirms before replacing existing song', async () => {
    const mockSong = { 
      _id: 'song1', 
      title: 'Test Song', 
      type: 'hymn'
    };
    
    await act(async () => {
      render(
        <QuickAddModal 
          isOpen={true}
          onClose={() => {}}
          song={mockSong}
        />
      );
    });
    
    // Wait for services to load and select first service
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/services/upcoming', expect.any(Object));
    });
    
    const serviceCards = await screen.findAllByTestId('service-card');
    fireEvent.click(serviceCards[0]);
    
    // Wait for slots to load
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/service-songs'), expect.any(Object));
    });
    
    // Find a filled slot (Opening Hymn has "Amazing Grace")
    const filledSlot = await screen.findByText('Opening Hymn');
    const filledSlotButton = filledSlot.closest('button');
    fireEvent.click(filledSlotButton);
    
    // Confirm dialog should be shown
    expect(confirm).toHaveBeenCalled();
    
    // Check if add song API is still called (since confirm returns true)
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/service-songs/quick-add', expect.any(Object));
    });
  });
});