/**
 * @jest-environment node
 */
import { GET, DELETE } from "./route";

const mockFindOne = jest.fn();
const mockDeleteOne = jest.fn();

jest.mock("@/lib/mongodb", () => ({
  __esModule: true,
  default: Promise.resolve({
    db: () => ({
      collection: () => ({ findOne: mockFindOne, deleteOne: mockDeleteOne }),
    }),
  }),
}));

const ID = "65f000000000000000000000";
// Next 16 passes params as a Promise
const ctx = { params: Promise.resolve({ id: ID }) };

describe("reference-songs/[id] with Next 16 async params", () => {
  test("GET finds the song instead of rejecting every id", async () => {
    mockFindOne.mockResolvedValue({ _id: ID, title: "Amazing Grace" });
    const res = await GET(
      new Request(`http://localhost/api/reference-songs/${ID}`),
      ctx,
    );
    expect(res.status).toBe(200);
    expect((await res.json()).title).toBe("Amazing Grace");
  });

  test("DELETE reaches the database", async () => {
    mockDeleteOne.mockResolvedValue({ deletedCount: 1 });
    const res = await DELETE(
      new Request(`http://localhost/api/reference-songs/${ID}`, {
        method: "DELETE",
      }),
      ctx,
    );
    expect(res.status).not.toBe(400);
    expect(mockDeleteOne).toHaveBeenCalled();
  });
});
