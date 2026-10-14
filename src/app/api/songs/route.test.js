/**
 * @jest-environment node
 */
import { POST } from "./route";

const mockUpdateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
const mockFindOne = jest.fn();

jest.mock("@/lib/mongodb", () => ({
  __esModule: true,
  default: Promise.resolve({
    db: () => ({
      collection: () => ({
        updateOne: mockUpdateOne,
        findOne: mockFindOne,
        insertOne: jest.fn().mockResolvedValue({ insertedId: "x" }),
      }),
    }),
  }),
}));

const post = (body) =>
  POST(
    new Request("http://localhost/api/songs", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );

const existing = {
  title: "This Little Light of Mine",
  type: "hymn",
  number: "677",
  hymnal: "cranberry",
  notes: "Only one verse; sing it through twice.",
  songOrder: "Verse 1, Chorus",
  seasonalTags: ["epiphany"],
  usageCount: 4,
};

describe("POST /api/songs on an existing song", () => {
  beforeEach(() => {
    mockUpdateOne.mockClear();
    mockFindOne.mockResolvedValue(existing);
  });

  test("REGRESSION: a service save never overwrites the song's notes, tags or order", async () => {
    // The shape the worship song picker sends: song facts, no notes
    await post({
      title: "This Little Light of Mine",
      type: "hymn",
      number: "677",
      hymnal: "cranberry",
      hymnaryLink: "https://hymnary.org/hymn/ELW2006/677",
      youtubeLink: "https://youtu.be/zUZ804_v4fY",
    });
    const { $set } = mockUpdateOne.mock.calls[0][1];
    expect($set.number).toBe("677");
    expect($set.hymnaryLink).toBe("https://hymnary.org/hymn/ELW2006/677");
    for (const field of ["notes", "songOrder", "seasonalTags", "usageCount"])
      expect($set).not.toHaveProperty(field);
  });

  test("an edit that sends notes still updates them", async () => {
    await post({
      title: "This Little Light of Mine",
      type: "hymn",
      notes: "New arrangement",
    });
    expect(mockUpdateOne.mock.calls[0][1].$set.notes).toBe("New arrangement");
  });

  test("REGRESSION: a Song Database edit never resets the usage count", async () => {
    // SongDatabase and the seasonal tagger send the whole song back
    await post({ ...existing, notes: "Fixed a typo", usageCount: 7 });
    expect(mockUpdateOne.mock.calls[0][1].$set).not.toHaveProperty(
      "usageCount",
    );
  });
});
