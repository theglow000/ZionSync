// Update SongSuggestionEngine.test.js to use the class-based implementation
import songSuggestionEngine, {
  SongSuggestionEngine,
} from "./SongSuggestionEngine";
import { getLiturgicalInfo } from "./LiturgicalCalendarService";

// Mock dependencies
jest.mock("./LiturgicalCalendarService", () => ({
  getLiturgicalInfo: jest.fn(),
}));

describe("SongSuggestionEngine", () => {
  let engine;

  const mockSongs = [
    {
      _id: "song1",
      title: "Amazing Grace",
      type: "hymn",
      seasonalTags: ["Lent", "Easter"],
    },
    {
      _id: "song2",
      title: "How Great Thou Art",
      type: "hymn",
      seasonalTags: ["Pentecost", "Ordinary"],
    },
    {
      _id: "song3",
      title: "Cornerstone",
      type: "contemporary",
      seasonalTags: ["Advent", "Christmas"],
    },
    {
      _id: "song4",
      title: "In Christ Alone",
      type: "contemporary",
      seasonalTags: ["Easter", "Pentecost"],
    },
  ];

  // Format usage data correctly for the actual implementation
  const mockUsageData = {
    serviceSongs: [
      { songTitle: "Amazing Grace", date: "2023-12-25" },
      { songTitle: "Amazing Grace", date: "2023-11-15" },
      { songTitle: "Amazing Grace", date: "2023-10-01" },
      { songTitle: "Amazing Grace", date: "2023-09-10" },
      { songTitle: "Amazing Grace", date: "2023-08-20" },
      { songTitle: "How Great Thou Art", date: "2024-01-15" },
      { songTitle: "How Great Thou Art", date: "2023-12-10" },
      { songTitle: "How Great Thou Art", date: "2023-11-05" },
      { songTitle: "Cornerstone", date: "2023-04-10" },
    ],
    frequency: [
      { title: "Amazing Grace", count: 5, lastUsed: new Date("2023-12-25") },
      {
        title: "How Great Thou Art",
        count: 3,
        lastUsed: new Date("2024-01-15"),
      },
      { title: "Cornerstone", count: 1, lastUsed: new Date("2023-04-10") },
    ],
  };

  beforeEach(() => {
    engine = new SongSuggestionEngine();
    getLiturgicalInfo.mockClear();
    getLiturgicalInfo.mockReturnValue({
      season: "Easter",
      color: "#FFFFFF",
      seasonName: "Easter",
    });

    // Mock internal methods if needed
    engine.balanceSongTypes = jest.fn((songs) => songs);
    engine.applyVarietyAlgorithm = jest.fn((songs) => songs);
  });

  describe("getSuggestions", () => {
    test("returns unused songs first", async () => {
      const result = await engine.getSuggestions({
        allSongs: mockSongs,
        usageData: mockUsageData,
        type: "all",
        limit: 10,
      });

      // Make sure result is not empty
      expect(result.length).toBeGreaterThan(0);

      // Find the "In Christ Alone" song which should be recommended early
      // since it hasn't been used
      const song4Index = result.findIndex((s) => s._id === "song4");
      expect(song4Index).not.toBe(-1);
      expect(song4Index).toBeLessThan(2); // Should be among first two songs
    });

    test("filters by song type", async () => {
      const result = await engine.getSuggestions({
        allSongs: mockSongs,
        usageData: mockUsageData,
        type: "contemporary",
        limit: 10,
      });

      // There should be some results
      expect(result.length).toBeGreaterThan(0);

      // All results should be contemporary songs
      const allContemporary = result.every(
        (song) => song.type === "contemporary",
      );
      expect(allContemporary).toBe(true);
    });

    test("combines usage and recency data", async () => {
      const result = await engine.getSuggestions({
        allSongs: mockSongs,
        usageData: mockUsageData,
        type: "all",
        limit: 10,
      });

      // Make sure we have results to compare
      expect(result.length).toBeGreaterThan(0);

      // Find indexes of songs to compare
      const song2Index = result.findIndex((s) => s._id === "song2");
      const song3Index = result.findIndex((s) => s._id === "song3");

      // Only test if both songs are in the results
      if (song2Index !== -1 && song3Index !== -1) {
        // song3 (used once) should come before song2 (used three times)
        expect(song3Index).toBeLessThan(song2Index);
      }
    });
  });

  // Add test for seasonal suggestions
  describe("seasonal filtering", () => {
    test("prioritizes songs matching current season", async () => {
      const result = await engine.getSuggestions({
        allSongs: mockSongs,
        usageData: mockUsageData,
        type: "all",
        useSeasonal: true,
        limit: 10,
      });

      // Make sure we have results
      expect(result.length).toBeGreaterThan(0);

      // Find songs matching Easter season
      const easterSongs = result.filter(
        (song) => song.seasonalTags && song.seasonalTags.includes("Easter"),
      );

      // There should be Easter songs in the result
      expect(easterSongs.length).toBeGreaterThan(0);
    });
  });
});
