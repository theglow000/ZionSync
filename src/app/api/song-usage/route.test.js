/**
 * @jest-environment node
 */
import { GET } from "./route";

const mockFindOne = jest.fn().mockResolvedValue(null);

jest.mock("@/lib/mongodb", () => ({
  __esModule: true,
  default: Promise.resolve({
    db: () => ({ collection: () => ({ findOne: mockFindOne }) }),
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
