/**
 * @jest-environment node
 */
import { POST } from "./route";

const mockSync = jest.fn().mockResolvedValue(undefined);
jest.mock("@/lib/songUsageSync", () => ({
  syncSongUsageForDate: (...args) => mockSync(...args),
}));

const SOURCE = "aaaaaaaaaaaaaaaaaaaaaaaa";
const TARGET = "bbbbbbbbbbbbbbbbbbbbbbbb";
const mockState = {};
const mockWrites = [];

jest.mock("@/lib/mongodb", () => ({
  __esModule: true,
  default: Promise.resolve({
    db: () => ({
      collection: (name) => ({
        findOne: async (q) =>
          name === "songs"
            ? mockState.songs.find((s) => s._id === String(q._id)) || null
            : null,
        find: () => ({ toArray: async () => mockState[name] || [] }),
        updateOne: async (...args) => mockWrites.push([name, ...args]),
        deleteOne: async () => ({ deletedCount: 1 }),
      }),
    }),
  }),
}));

const merge = () =>
  POST(
    new Request("http://localhost/api/songs/merge", {
      method: "POST",
      body: JSON.stringify({ sourceId: SOURCE, targetId: TARGET }),
    }),
  );

describe("POST /api/songs/merge", () => {
  beforeEach(() => {
    mockSync.mockClear();
    mockWrites.length = 0;
    mockState.songs = [
      { _id: SOURCE, title: "Shine, Jesus Shine", type: "hymn" },
      {
        _id: TARGET,
        title: "Shine, Jesus, Shine",
        type: "hymn",
        number: "671",
        hymnal: "cranberry",
      },
    ];
    mockState.service_songs = [
      {
        date: "3/15/26",
        selections: {
          song_0: { title: "Shine, Jesus Shine", notes: "All verses" },
        },
      },
      { date: "3/22/26", selections: { song_0: { title: "Other" } } },
    ];
    mockState.serviceDetails = [
      {
        date: "3/15/26",
        elements: [
          {
            type: "song_hymn",
            content: "Opening Hymn: Shine, Jesus Shine",
            selection: { title: "Shine, Jesus Shine" },
          },
        ],
      },
    ];
  });

  test("REGRESSION: services that used the merged song now name the kept song", async () => {
    const res = await merge();
    expect(res.status).toBe(200);

    const picks = mockWrites.find(
      ([n, q]) => n === "service_songs" && q.date === "3/15/26",
    );
    const sel = picks[2].$set["selections.song_0"];
    expect(sel).toMatchObject({
      title: "Shine, Jesus, Shine",
      number: "671",
      notes: "All verses",
    });
    expect(
      mockWrites.some(
        ([n, q]) => n === "service_songs" && q.date === "3/22/26",
      ),
    ).toBe(false);

    const details = mockWrites.find(([n]) => n === "serviceDetails");
    expect(details[2].$set["elements.0.selection"].title).toBe(
      "Shine, Jesus, Shine",
    );
    expect(details[2].$set["elements.0.content"]).toBe(
      "Opening Hymn: Shine, Jesus, Shine",
    );

    // History re-synced for the renamed date only
    expect(mockSync).toHaveBeenCalledTimes(1);
    expect(mockSync.mock.calls[0][1]).toBe("3/15/26");
  });
});
