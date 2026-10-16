/**
 * @jest-environment node
 */
import { POST } from "./route";

const mockSync = jest.fn().mockResolvedValue(undefined);
const mockRefresh = jest.fn().mockResolvedValue(undefined);
jest.mock("@/lib/songUsageSync", () => ({
  syncSongUsageForDate: (...args) => mockSync(...args),
  refreshSongStats: (...args) => mockRefresh(...args),
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
            : (mockState[name] || []).find((d) => d.title === q.title) || null,
        find: () => ({ toArray: async () => mockState[name] || [] }),
        updateOne: async (...args) => mockWrites.push([name, ...args]),
        deleteOne: async (q) => {
          mockWrites.push([name, q, "delete"]);
          return { deletedCount: 1 };
        },
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
    mockRefresh.mockClear();
    mockWrites.length = 0;
    mockState.song_usage = [];
    mockState.songs = [
      { _id: SOURCE, title: "Shine, Jesus Shine", type: "hymn" },
      {
        _id: TARGET,
        title: "Shine, Jesus, Shine",
        type: "hymn",
        number: "671",
        hymnal: "cranberry",
        youtube: "https://youtu.be/kept",
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
        type: "communion",
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

  test("renamed picks take the kept song's links; history keeps the service type", async () => {
    mockState.service_songs[0].selections.song_0.youtube =
      "https://youtu.be/old";
    await merge();
    const picks = mockWrites.find(
      ([n, q]) => n === "service_songs" && q.date === "3/15/26",
    );
    expect(picks[2].$set["selections.song_0"].youtube).toBe(
      "https://youtu.be/kept",
    );
    expect(mockSync.mock.calls[0][3]).toMatchObject({ service: "communion" });
  });

  test("kept song's usage count and rotation are recomputed after the merge", async () => {
    await merge();
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect([...mockRefresh.mock.calls[0][1]]).toEqual(["Shine, Jesus, Shine"]);
  });

  test("REGRESSION: two records with the exact same title never lose their history", async () => {
    mockState.songs[0].title = mockState.songs[1].title;
    mockState.song_usage = [
      { _id: "u1", title: "Shine, Jesus, Shine", uses: [{ dateUsed: "x" }] },
    ];
    await merge();
    expect(mockWrites.some(([n]) => n === "song_usage")).toBe(false);
  });
});
