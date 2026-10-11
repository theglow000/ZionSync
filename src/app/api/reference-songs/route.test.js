/**
 * @jest-environment node
 */
import { GET } from "./route";

const mockFind = jest.fn(() => ({
  sort: () => ({ toArray: async () => [] }),
}));

jest.mock("@/lib/mongodb", () => ({
  __esModule: true,
  default: Promise.resolve({
    db: () => ({ collection: () => ({ find: mockFind }) }),
  }),
}));

describe("GET /api/reference-songs search", () => {
  test("searches typed text literally, not as a regex pattern", async () => {
    await GET(
      new Request("http://localhost/api/reference-songs?query=Fount%20(v.2)"),
    );
    const { $or } = mockFind.mock.calls[0][0];
    expect($or[0].title.$regex).toBe("Fount \\(v\\.2\\)");
    expect($or[1].author.$regex).toBe("Fount \\(v\\.2\\)");
  });
});
