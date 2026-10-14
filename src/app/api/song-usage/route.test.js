/**
 * @jest-environment node
 */
import { GET } from "./route";

const mockFindOne = jest.fn().mockResolvedValue(null);
const mockUsageDocs = [];

jest.mock("@/lib/mongodb", () => ({
  __esModule: true,
  default: Promise.resolve({
    db: () => ({
      collection: () => ({
        findOne: mockFindOne,
        find: () => ({ toArray: async () => mockUsageDocs }),
      }),
    }),
  }),
}));

describe("GET /api/song-usage rotation lookup by id", () => {
  test("a malformed songId is a 404, not a 500", async () => {
    const res = await GET(
      new Request(
        "http://localhost/api/song-usage?songId=not-an-id&rotation=true",
      ),
    );
    expect(res.status).toBe(404);
  });
});

describe("GET /api/song-usage recent uses (the repeat warning)", () => {
  test("REGRESSION: finds history recorded under a different spelling", async () => {
    const recent = new Date(Date.now() - 7 * 86400000);
    mockUsageDocs.splice(0, mockUsageDocs.length, {
      title: "Standing on the Promises ",
      uses: [{ dateUsed: recent, service: "x", addedBy: "y" }],
    });
    const res = await GET(
      new Request(
        "http://localhost/api/song-usage?title=Standing%20on%20the%20Promises&months=1",
      ),
    );
    expect(await res.json()).toHaveLength(1);
  });
});
