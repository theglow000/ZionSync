import { matchesQuery } from "./mongoMatch";

describe("matchesQuery", () => {
  const doc = {
    title: "Shine, Jesus Shine",
    uses: [{ dateUsed: new Date("2026-03-15T12:00:00Z") }],
  };
  test("equality, regex, $or and ranges through arrays", () => {
    expect(matchesQuery(doc, { title: "Shine, Jesus Shine" })).toBe(true);
    expect(matchesQuery(doc, { title: /^shine/i })).toBe(true);
    expect(matchesQuery(doc, { title: "x" })).toBe(false);
    const window = {
      $gte: new Date("2026-03-15T06:00:00Z"),
      $lt: new Date("2026-03-16T06:00:00Z"),
    };
    expect(matchesQuery(doc, { "uses.dateUsed": window })).toBe(true);
    expect(
      matchesQuery(doc, { $or: [{ title: "x" }, { "uses.dateUsed": window }] }),
    ).toBe(true);
    expect(matchesQuery(doc, { $or: [{ title: "x" }] })).toBe(false);
  });
});
