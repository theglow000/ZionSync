/**
 * @jest-environment node
 */
import { POST } from "./route";

const mockUpdateOne = jest.fn().mockResolvedValue({});
const mockFindOne = jest.fn();

jest.mock("@/lib/mongodb", () => ({
  __esModule: true,
  default: Promise.resolve({
    db: () => ({
      collection: () => ({ updateOne: mockUpdateOne, findOne: mockFindOne }),
    }),
  }),
}));

const elements = [
  { type: "song_hymn", content: "Opening Hymn:" },
  { type: "liturgy", content: "Greeting" },
  { type: "song_hymn", content: "Hymn of the Day:" },
  { type: "liturgical_song", content: "Kyrie" },
  { type: "song_hymn", content: "Sending Song:" },
];

const post = (selections) =>
  POST(
    new Request("http://localhost/api/service-songs", {
      method: "POST",
      body: JSON.stringify({ date: "10/18/26", selections, updatedBy: "Ben" }),
    }),
  );

const hymn = (title, number) => ({
  type: "hymn",
  title,
  number,
  hymnal: "cranberry",
});

// The update written to serviceDetails (the second updateOne call)
const detailsUpdate = () =>
  mockUpdateOne.mock.calls.find(([, update]) =>
    Object.keys(update.$set || {}).some((k) => k.startsWith("elements.")),
  )[1];

describe("POST /api/service-songs", () => {
  beforeEach(() => {
    mockUpdateOne.mockClear();
    mockFindOne.mockResolvedValue({ date: "10/18/26", elements });
  });

  test("REGRESSION X1: a blank middle slot does not shift the sending song up", async () => {
    const res = await post({
      song_0: hymn("Amazing Grace", "123"),
      song_2: hymn("How Great Thou Art", "789"),
    });
    expect(res.status).toBe(200);

    const { $set } = detailsUpdate();
    expect($set["elements.0.content"]).toBe(
      "Opening Hymn: Amazing Grace #123 (Cranberry)",
    );
    expect($set["elements.2.content"]).toBe(
      "Hymn of the Day: <Awaiting Song Selection>",
    );
    expect($set["elements.4.content"]).toBe(
      "Sending Song: How Great Thou Art #789 (Cranberry)",
    );
  });

  test("REGRESSION X2: stores the label as selection.content, like the client", async () => {
    await post({ song_0: hymn("Amazing Grace", "123") });
    const { $set } = detailsUpdate();
    expect($set["elements.0.selection"]).toMatchObject({
      title: "Amazing Grace",
      content: "Opening Hymn",
    });
  });

  test("only touches song lines (surgical update)", async () => {
    await post({ song_0: hymn("Amazing Grace", "123") });
    const update = detailsUpdate();
    const touched = [
      ...Object.keys(update.$set),
      ...Object.keys(update.$unset || {}),
    ].filter((k) => k.startsWith("elements."));
    expect(touched.every((k) => /^elements\.(0|2|4)\./.test(k))).toBe(true);
    expect(update.$unset).toEqual({
      "elements.2.selection": "",
      "elements.4.selection": "",
    });
  });
});
