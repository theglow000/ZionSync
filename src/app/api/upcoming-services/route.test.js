import { GET } from "./route";
import { NextResponse } from "next/server";

// Mock dependencies
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
  },
}));

// We need to use a factory function for the MongoDB mock
// to avoid reference errors with Jest's hoisting
jest.mock("@/lib/mongodb", () => {
  // Create the mock structure inside the factory
  const mockDb = {
    collection: jest.fn().mockReturnValue({
      find: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          {
            _id: "service1",
            date: "3/15/25",
            type: "sunday",
            elements: [
              {
                type: "song_hymn",
                position: "opening",
                title: "Amazing Grace",
              },
            ],
          },
          {
            _id: "service2",
            date: "3/22/25",
            type: "sunday",
            elements: [],
          },
        ]),
      }),
      findOne: jest.fn(),
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

jest.mock("@/lib/LiturgicalCalendarService", () => ({
  getLiturgicalInfo: jest.fn().mockReturnValue({
    season: "ORDINARY_TIME",
    seasonName: "Ordinary Time",
    color: "#00AA00",
  }),
}));

// Retrieve the mock objects for testing
const { _mockClient: mockClient, _mockDb: mockDb } = require("@/lib/mongodb");

// Mock console methods to reduce test noise
jest.spyOn(console, "log").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

describe("GET /api/upcoming-services", () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns formatted services", async () => {
    const mockRequest = {
      url: "http://localhost:3000/api/upcoming-services?limit=2",
    };

    const response = await GET(mockRequest);

    // Verify that the DB was queried correctly
    expect(mockClient.db).toHaveBeenCalledWith("church");
    expect(mockDb.collection).toHaveBeenCalledWith("serviceDetails");

    // Verify the response format
    expect(NextResponse.json).toHaveBeenCalled();
    expect(response).toBeDefined();
  });

  test("handles errors gracefully", async () => {
    // Force an error in the database operation
    mockClient.db.mockImplementationOnce(() => {
      throw new Error("Database error");
    });

    const mockRequest = {
      url: "http://localhost:3000/api/upcoming-services",
    };

    await GET(mockRequest);

    // Verify error is handled correctly
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Database error" },
      { status: 500 },
    );
  });
});
