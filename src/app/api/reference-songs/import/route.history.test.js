/**
 * @jest-environment node
 */
import { POST } from "./route";

const mockSync = jest.fn().mockResolvedValue(undefined);
jest.mock("@/lib/songUsageSync", () => ({
  syncSongUsageForDate: (...args) => mockSync(...args),
}));

const mockData = {};
const mockWrites = [];
jest.mock("@/lib/mongodb.js", () => ({
  __esModule: true,
  default: Promise.resolve({
    db: () => ({
      collection: (name) => ({
        findOne: async () => mockData[name] ?? null,
        updateOne: async (...args) => {
          mockWrites.push([name, ...args]);
          return { modifiedCount: 1 };
        },
        insertOne: async () => ({ insertedId: "new" }),
      }),
    }),
  }),
}));

const post = () =>
  POST(
    new Request("http://localhost/api/reference-songs/import", {
      method: "POST",
      body: JSON.stringify({
        referenceSongId: "ref1",
        serviceDate: "10/18/26",
        position: "song_1",
        songData: { title: "Amazing Grace", type: "hymn" },
      }),
    }),
  );

describe("POST /api/reference-songs/import — song history", () => {
  beforeEach(() => {
    mockSync.mockClear();
    mockWrites.length = 0;
    mockData.songs = { _id: "s1", title: "Amazing Grace", type: "hymn" };
    mockData.serviceDetails = {
      date: "10/18/26",
      type: "communion",
      elements: [
        { type: "song_hymn", content: "Opening Hymn:" },
        { type: "song_hymn", content: "Hymn of the Day:" },
      ],
    };
    mockData.service_songs = {
      date: "10/18/26",
      selections: {
        song_0: { title: "Be Thou My Vision" },
        song_1: { title: "Amazing Grace" },
      },
    };
  });

  test("REGRESSION: history is synced to the whole service, on the right day", async () => {
    const res = await post();
    expect(res.status).toBe(200);
    expect(mockSync).toHaveBeenCalledWith(
      expect.anything(),
      "10/18/26",
      mockData.service_songs.selections,
      expect.objectContaining({ service: "communion" }),
    );
    // No separate, differently-dated history write
    expect(mockWrites.some(([name]) => name === "song_usage")).toBe(false);
  });
});
