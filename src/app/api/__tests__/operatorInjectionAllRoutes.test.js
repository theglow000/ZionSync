/**
 * @jest-environment node
 *
 * SECURITY: routes without a per-route schema still reject any body that
 * carries a Mongo operator key, before touching the database.
 */
import * as songs from "../songs/route";
import * as serviceDetails from "../service-details/route";
import * as serviceSongs from "../service-songs/route";
import * as songUsage from "../song-usage/route";
import * as referenceSongById from "../reference-songs/[id]/route";
import * as calendarGenerate from "../service-calendar/generate/route";
import * as songMerge from "../songs/merge/route";
import * as referenceImport from "../reference-songs/import/route";
import * as calendarRevert from "../service-calendar/revert/route";
import * as completed from "../completed/route";
import * as worshipAssignments from "../worship-assignments/route";
import * as calendarOverride from "../service-calendar/override/route";
import * as referenceSongs from "../reference-songs/route";

const mockCollection = jest.fn();

jest.mock("@/lib/mongodb", () => ({
  __esModule: true,
  default: Promise.resolve({
    db: () => ({ collection: (...args) => mockCollection(...args) }),
  }),
}));

const op = { $ne: null };
// Every filter-ish field these routes read, each replaced by an operator
const attack = {
  date: op,
  title: op,
  name: op,
  year: op,
  dateString: op,
  songId: op,
  serviceDate: op,
  sourceId: op,
  targetId: op,
  id: op,
};

const req = (method) =>
  new Request("http://localhost/api/x", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(attack),
  });

const params = { params: Promise.resolve({ id: "65f000000000000000000000" }) };

const cases = [
  ["songs POST", songs.POST, "POST"],
  ["service-details POST", serviceDetails.POST, "POST"],
  ["service-songs POST", serviceSongs.POST, "POST"],
  ["song-usage POST", songUsage.POST, "POST"],
  ["reference-songs/[id] PUT", referenceSongById.PUT, "PUT"],
  ["service-calendar/generate POST", calendarGenerate.POST, "POST"],
  ["songs/merge POST", songMerge.POST, "POST"],
  ["reference-songs/import POST", referenceImport.POST, "POST"],
  ["service-calendar/revert POST", calendarRevert.POST, "POST"],
  ["completed POST", completed.POST, "POST"],
  ["worship-assignments POST", worshipAssignments.POST, "POST"],
  ["service-calendar/override PATCH", calendarOverride.PATCH, "PATCH"],
  ["reference-songs POST", referenceSongs.POST, "POST"],
];

describe("operator injection — all body-reading routes", () => {
  beforeEach(() => mockCollection.mockReset());

  test.each(cases)(
    "%s rejects an operator body with 400",
    async (_l, handler, method) => {
      const res = await handler(req(method), params);
      expect(res.status).toBe(400);
      expect(mockCollection).not.toHaveBeenCalled();
    },
  );
});
