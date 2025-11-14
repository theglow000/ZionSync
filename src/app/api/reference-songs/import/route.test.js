import { POST } from "./route";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

// Mock dependencies
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
  },
}));

// Mock ObjectId from mongodb
jest.mock("mongodb", () => ({
  ObjectId: jest.fn((id) => id),
}));

// We need to use a factory function for the MongoDB mock
// to avoid reference errors with Jest's hoisting
jest.mock("@/lib/mongodb.js", () => {
  // Create the mock structure inside the factory
  const mockDb = {
    collection: jest.fn().mockImplementation((collectionName) => {
      if (collectionName === "songs") {
        return {
          find: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue([]),
          }),
          findOne: jest.fn().mockImplementation((query) => {
            // Check if this is a query for an existing song by title
            if (query?.title === "Amazing Grace") {
              return Promise.resolve({
                _id: "existing123",
                title: "Amazing Grace",
                lyrics: "Amazing grace, how sweet the sound",
                type: "hymn",
              });
            }
            return Promise.resolve(null);
          }),
          insertOne: jest.fn().mockResolvedValue({
            insertedId: "new123",
          }),
        };
      } else if (collectionName === "service_details") {
        return {
          findOne: jest.fn().mockResolvedValue({
            date: "3/15/25",
            elements: [],
          }),
          updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
        };
      } else if (collectionName === "service_songs") {
        return {
          updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
        };
      } else if (collectionName === "reference_songs") {
        return {
          findOne: jest.fn().mockResolvedValue({
            _id: "ref123",
            title: "Amazing Grace",
            lyrics: "Amazing grace, how sweet the sound",
            type: "hymn",
          }),
        };
      }
      return {
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([]),
        }),
        findOne: jest.fn().mockResolvedValue(null),
        updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
        insertOne: jest.fn().mockResolvedValue({ insertedId: "new123" }),
      };
    }),
  };

  const mockClient = {
    db: jest.fn().mockReturnValue(mockDb),
  };

  // Export both the clientPromise mock and the internals for testing
  return {
    __esModule: true,
    default: Promise.resolve(mockClient),
    _mockClient: mockClient,
    _mockDb: mockDb,
  };
});

// Retrieve the mock objects for testing
const {
  _mockClient: mockClient,
  _mockDb: mockDb,
} = require("@/lib/mongodb.js");

// Mock console methods to reduce test noise
jest.spyOn(console, "log").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

describe("POST /api/reference-songs/import", () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("imports a reference song to a service successfully", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        referenceSongId: "ref123",
        serviceDate: "3/15/25",
        position: "opening",
        songData: {
          title: "Amazing Grace",
          lyrics: "Amazing grace, how sweet the sound",
          type: "hymn",
        },
      }),
    };

    const response = await POST(mockRequest);

    // Verify that the DB was queried correctly
    expect(mockClient.db).toHaveBeenCalledWith("church");

    // Verify the response format
    expect(NextResponse.json).toHaveBeenCalled();
    expect(response).toBeDefined();
  });

  test("returns 400 when required fields are missing", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        // Missing serviceDate
        referenceSongId: "ref123",
        position: "opening",
        songData: {
          title: "Amazing Grace",
          type: "hymn",
        },
      }),
    };

    await POST(mockRequest);

    expect(NextResponse.json).toHaveBeenCalledWith(
      { message: "Missing required fields" },
      { status: 400 },
    );
  });

  test("returns 400 when song data is invalid", async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        referenceSongId: "ref123",
        serviceDate: "3/15/25",
        position: "opening",
        songData: {
          // Missing title
          lyrics: "Amazing grace, how sweet the sound",
          type: "hymn",
        },
      }),
    };

    await POST(mockRequest);

    expect(NextResponse.json).toHaveBeenCalledWith(
      { message: "Reference song data is missing or invalid" },
      { status: 400 },
    );
  });

  test("handles database errors gracefully", async () => {
    // Force an error in the database operation
    mockClient.db.mockImplementationOnce(() => {
      throw new Error("Database connection error");
    });

    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        referenceSongId: "ref123",
        serviceDate: "3/15/25",
        position: "opening",
        songData: {
          title: "Amazing Grace",
          lyrics: "Amazing grace, how sweet the sound",
          type: "hymn",
        },
      }),
    };

    await POST(mockRequest);

    // Verify error is handled correctly
    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(String) }),
      { status: 500 },
    );
  });
});
