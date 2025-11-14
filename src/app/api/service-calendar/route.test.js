/**
 * Tests for Service Calendar API Routes (Sprint 4.1)
 * Tests the GET endpoint for algorithmically-generated service calendar
 *
 * NOTE: POST/PUT/DELETE endpoints pending implementation
 */

import { GET } from "./route";
import { NextRequest } from "next/server";
import clientPromise from "@/lib/mongodb";

// Mock dependencies
jest.mock("@/lib/mongodb");

describe("Service Calendar API - GET", () => {
  let mockDb;
  let mockCollection;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCollection = {
      findOne: jest.fn(),
    };

    mockDb = {
      collection: jest.fn(() => mockCollection),
    };

    clientPromise.mockResolvedValue({
      db: jest.fn(() => mockDb),
    });
  });

  test("returns services for valid year", async () => {
    const mockCalendar = {
      year: 2025,
      services: [
        {
          date: "1/5/25",
          dateString: "January 5, 2025",
          season: "epiphany",
          seasonName: "Epiphany",
          seasonColor: "#FFD700",
          isRegularSunday: true,
        },
      ],
      metadata: { serviceCount: 63 },
      generatedAt: new Date(),
    };

    mockCollection.findOne.mockResolvedValue(mockCalendar);

    const request = new NextRequest(
      "http://localhost:3000/api/service-calendar?year=2025",
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.year).toBe(2025);
    expect(data.services).toHaveLength(1);
    expect(data.services[0].season).toBe("epiphany");
  });

  test("returns 400 for missing year parameter", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/service-calendar",
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("required");
  });

  test("returns 400 for year below range", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/service-calendar?year=2023",
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("between 2024 and 2100");
  });

  test("returns 400 for year above range", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/service-calendar?year=2101",
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("between 2024 and 2100");
  });

  test("returns 404 for year not generated", async () => {
    mockCollection.findOne.mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost:3000/api/service-calendar?year=2026",
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain("No services found");
  });

  test("returns metadata with services", async () => {
    mockCollection.findOne.mockResolvedValue({
      year: 2025,
      services: [],
      metadata: { serviceCount: 63, regularSundays: 52 },
      keyDates: {
        ashWednesday: "3/5/25",
        easter: "4/20/25",
      },
      algorithmVersion: "1.0.0",
    });

    const request = new NextRequest(
      "http://localhost:3000/api/service-calendar?year=2025",
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.metadata.serviceCount).toBe(63);
    expect(data.keyDates.easter).toBe("4/20/25");
    expect(data.algorithmVersion).toBe("1.0.0");
  });

  test("handles database errors gracefully", async () => {
    clientPromise.mockRejectedValue(new Error("DB connection failed"));

    const request = new NextRequest(
      "http://localhost:3000/api/service-calendar?year=2025",
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain("Failed to fetch");
  });
});
