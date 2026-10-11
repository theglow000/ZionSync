/**
 * @jest-environment node
 *
 * SECURITY: every mutating route must reject a Mongo operator object where it
 * expects a string, before touching the database. A body like
 * {"name": {"$ne": null}} would otherwise match every document.
 */
import * as users from "../users/route";
import * as signups from "../signups/route";
import * as worshipUsers from "../users/worship/route";
import * as customServices from "../custom-services/route";
import * as songs from "../songs/route";
import * as avTeam from "../av-team/route";
import * as avUsers from "../av-users/route";

const mockCollection = jest.fn();

jest.mock("@/lib/mongodb", () => ({
  __esModule: true,
  default: Promise.resolve({
    db: () => ({ collection: (...args) => mockCollection(...args) }),
  }),
}));

const req = (method, body) =>
  new Request("http://localhost/api/x", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const op = { $ne: null };

const cases = [
  ["POST /api/users", users.POST, "POST", { name: op }],
  ["DELETE /api/users", users.DELETE, "DELETE", { name: op }],
  ["POST /api/signups", signups.POST, "POST", { date: "1/1/26", name: op }],
  ["DELETE /api/signups", signups.DELETE, "DELETE", { date: op, name: "Ben" }],
  ["POST /api/users/worship", worshipUsers.POST, "POST", { name: op }],
  ["DELETE /api/users/worship", worshipUsers.DELETE, "DELETE", { name: op }],
  [
    "PUT /api/custom-services",
    customServices.PUT,
    "PUT",
    { id: op, name: "x", elements: [] },
  ],
  ["DELETE /api/custom-services", customServices.DELETE, "DELETE", { id: op }],
  [
    "POST /api/av-team signup",
    avTeam.POST,
    "POST",
    { type: "signup", date: op, position: 1, name: "Ben" },
  ],
  [
    "POST /api/av-team position",
    avTeam.POST,
    "POST",
    { type: "signup", date: "1/1/26", position: "1, x", name: "Ben" },
  ],
  [
    "POST /api/av-team completed",
    avTeam.POST,
    "POST",
    { type: "completed", date: op, completed: true },
  ],
  ["DELETE /api/av-team", avTeam.DELETE, "DELETE", { date: op }],
  ["POST /api/av-users", avUsers.POST, "POST", { name: op }],
  ["PATCH /api/av-users", avUsers.PATCH, "PATCH", { name: op, core: true }],
  ["DELETE /api/av-users", avUsers.DELETE, "DELETE", { name: op }],
];

describe("operator injection", () => {
  beforeEach(() => mockCollection.mockReset());

  test.each(cases)(
    "%s rejects an operator object with 400",
    async (_label, handler, method, body) => {
      const res = await handler(req(method, body));
      expect(res.status).toBe(400);
      expect(mockCollection).not.toHaveBeenCalled();
    },
  );

  test("DELETE /api/songs rejects a malformed id with 400 instead of crashing", async () => {
    const res = await songs.DELETE(
      new Request("http://localhost/api/songs?id=not-an-object-id", {
        method: "DELETE",
      }),
    );
    expect(res.status).toBe(400);
    expect(mockCollection).not.toHaveBeenCalled();
  });

  // Shapes the app's own pages send — the guard must not break normal use
  const okDb = () => {
    const ok = jest.fn().mockResolvedValue({
      acknowledged: true,
      matchedCount: 1,
      modifiedCount: 1,
      deletedCount: 1,
      upsertedCount: 0,
      insertedId: "x",
    });
    mockCollection.mockReturnValue({
      insertOne: ok,
      updateOne: ok,
      deleteOne: ok,
      deleteMany: ok,
      findOne: jest.fn().mockResolvedValue(null),
      find: () => ({ toArray: jest.fn().mockResolvedValue([]) }),
    });
  };

  const legit = [
    ["DELETE /api/users", users.DELETE, "DELETE", { name: "Ben" }],
    [
      "POST /api/signups",
      signups.POST,
      "POST",
      { date: "10/18/26", name: "Ben" },
    ],
    [
      "POST /api/users/worship with role",
      worshipUsers.POST,
      "POST",
      { name: "Ben", role: "leader" },
    ],
    [
      "DELETE /api/custom-services",
      customServices.DELETE,
      "DELETE",
      { id: "custom_123" },
    ],
    [
      "av-team signup",
      avTeam.POST,
      "POST",
      {
        type: "signup",
        date: "10/18/26",
        position: 2,
        name: "Doug",
        serviceTime: null,
      },
    ],
    [
      "av-team clear slot",
      avTeam.POST,
      "POST",
      {
        type: "signup",
        date: "10/18/26",
        position: 3,
        name: null,
        serviceTime: "9:00 AM",
      },
    ],
    [
      "av-team migrate empty slot (name omitted)",
      avTeam.POST,
      "POST",
      { type: "signup", date: "12/24/26", position: 1, serviceTime: "3:00 PM" },
    ],
    [
      "av-team completed",
      avTeam.POST,
      "POST",
      { type: "completed", date: "10/18/26", completed: true },
    ],
    [
      "av-team delete",
      avTeam.DELETE,
      "DELETE",
      { date: "10/18/26", serviceTime: null },
    ],
    [
      "av-users core toggle",
      avUsers.PATCH,
      "PATCH",
      { name: "Abbey", core: true },
    ],
  ];

  test.each(legit)(
    "%s still passes validation",
    async (_label, handler, method, body) => {
      okDb();
      const res = await handler(req(method, body));
      expect(res.status).not.toBe(400);
    },
  );
});
