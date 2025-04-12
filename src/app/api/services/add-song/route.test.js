import { POST } from './route';
import { NextResponse } from 'next/server';

// Mock dependencies
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options }))
  }
}));

// We need to use a factory function for the MongoDB mock
// to avoid reference errors with Jest's hoisting
jest.mock('@/lib/mongodb.js', () => {
  // Create the mock structure inside the factory
  const mockDb = {
    collection: jest.fn().mockImplementation((collectionName) => {
      if (collectionName === "songs") {
        return {
          find: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue([])
          }),
          findOne: jest.fn().mockImplementation(({ _id }) => {
            if (_id === "123") {
              return Promise.resolve({
                _id: "123",
                title: "Amazing Grace",
                lyrics: "Amazing grace, how sweet the sound",
                type: "hymn"
              });
            }
            return Promise.resolve(null);
          })
        };
      } else if (collectionName === "service_details") {
        return {
          find: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue([])
          }),
          findOne: jest.fn().mockImplementation(({ date }) => {
            if (date === "3/15/25") {
              return Promise.resolve({
                date: "3/15/25",
                elements: []
              });
            }
            return Promise.resolve(null);
          }),
          updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 })
        };
      } else if (collectionName === "service_songs") {
        return {
          updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 })
        };
      }
      return {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([])
        }),
        findOne: jest.fn().mockResolvedValue(null),
        updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 })
      };
    })
  };
  
  const mockClient = {
    db: jest.fn().mockReturnValue(mockDb)
  };
  
  // Export both the clientPromise mock and the internals for testing
  return {
    __esModule: true,
    default: Promise.resolve(mockClient),
    _mockClient: mockClient,
    _mockDb: mockDb
  };
});

// Retrieve the mock objects for testing
const { _mockClient: mockClient, _mockDb: mockDb } = require('@/lib/mongodb.js');

// Mock console methods to reduce test noise
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('POST /api/services/add-song', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('adds a song to a service successfully', async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        songId: "123",
        serviceDate: "3/15/25",
        position: "opening",
        notes: "Play in G"
      })
    };

    const response = await POST(mockRequest);
    
    // Verify that the DB was queried correctly
    expect(mockClient.db).toHaveBeenCalledWith('church');
    expect(mockDb.collection).toHaveBeenCalledWith('songs');
    expect(mockDb.collection).toHaveBeenCalledWith('service_details');
    
    // Verify the response format
    expect(NextResponse.json).toHaveBeenCalled();
    expect(response).toBeDefined();
  });

  test('returns 400 when required fields are missing', async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        // Missing serviceDate
        songId: "123",
        position: "opening"
      })
    };

    await POST(mockRequest);

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  });

  test('returns 404 when song not found', async () => {
    // Configure the songs collection to return null (not found)
    const songsCollection = mockDb.collection('songs');
    songsCollection.findOne.mockResolvedValueOnce(null);

    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        songId: "999", // Non-existent song ID
        serviceDate: "3/15/25",
        position: "opening"
      })
    };

    await POST(mockRequest);

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Song not found' },
      { status: 404 }
    );
  });

  test('handles database errors gracefully', async () => {
    // Force an error in the database operation
    mockClient.db.mockImplementationOnce(() => {
      throw new Error('Database connection error');
    });

    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        songId: "123",
        serviceDate: "3/15/25",
        position: "opening"
      })
    };

    await POST(mockRequest);

    // Verify error is handled correctly
    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(String) }),
      { status: 500 }
    );
  });
});