import {
  parseServiceDate,
  formatServiceDate,
  getEpochFor,
  crewForTurn,
  getRotationCrew,
  buildNextEpoch,
} from "./avRotation";

const SEED = {
  effectiveDate: "10/25/26",
  members: ["Ben", "Doug", "Jaimes", "Brett", "Abbey"],
};

// Sundays starting at `start`, `count` of them, as app-format strings
const sundays = (start, count) => {
  const out = [];
  const d = parseServiceDate(start);
  for (let i = 0; i < count; i++) {
    out.push(formatServiceDate(d));
    d.setDate(d.getDate() + 7);
  }
  return out;
};

const crewOn = (date, epochs = [SEED], type = "regular", legacyIndex = 0) =>
  getRotationCrew({ date, type, legacyIndex, epochs });

describe("date helpers", () => {
  it("round-trips the app's unpadded M/D/YY format", () => {
    expect(formatServiceDate(parseServiceDate("1/4/27"))).toBe("1/4/27");
    expect(formatServiceDate(parseServiceDate("12/24/26"))).toBe("12/24/26");
  });
});

describe("getRotationCrew — before the first epoch", () => {
  it("keeps 10/18/26 on the legacy Ben + Doug/Jaimes/Brett rule", () => {
    expect(crewOn("10/18/26", [SEED], "regular", 0)).toEqual({
      slot1: "Ben",
      slot2: "Doug",
      source: "legacy",
    });
    expect(crewOn("10/18/26", [SEED], "regular", 4).slot2).toBe("Jaimes");
    expect(crewOn("6/7/26", [SEED], "regular", 2).slot2).toBe("Brett");
  });

  it("keeps legacy for special services too (history is untouched)", () => {
    expect(crewOn("10/14/26", [SEED], "special", 1).source).toBe("legacy");
  });

  it("uses legacy when there are no epochs at all", () => {
    expect(crewOn("11/1/26", [], "regular", 0).source).toBe("legacy");
  });
});

describe("getRotationCrew — five-person core", () => {
  it("starts 10/25/26 with the agreed cycle", () => {
    const pairs = sundays("10/25/26", 6).map((d) => {
      const c = crewOn(d);
      return `${c.slot1}+${c.slot2}`;
    });
    expect(pairs).toEqual([
      "Ben+Doug",
      "Jaimes+Brett",
      "Abbey+Ben",
      "Doug+Jaimes",
      "Brett+Abbey",
      "Ben+Doug",
    ]);
  });

  it("never schedules anyone two Sundays in a row (20 weeks, across DST and New Year)", () => {
    const crews = sundays("10/25/26", 20).map((d) => crewOn(d));
    for (let i = 1; i < crews.length; i++) {
      const prev = [crews[i - 1].slot1, crews[i - 1].slot2];
      expect(prev).not.toContain(crews[i].slot1);
      expect(prev).not.toContain(crews[i].slot2);
    }
  });

  it("gives everyone exactly 2 of every 5 Sundays", () => {
    const counts = {};
    sundays("10/25/26", 25).forEach((d) => {
      const c = crewOn(d);
      counts[c.slot1] = (counts[c.slot1] || 0) + 1;
      counts[c.slot2] = (counts[c.slot2] || 0) + 1;
    });
    expect(counts).toEqual({
      Ben: 10,
      Doug: 10,
      Jaimes: 10,
      Brett: 10,
      Abbey: 10,
    });
  });

  it("does not drift a week across the fall and spring DST changes", () => {
    // 11/1/26 is the fall-back Sunday (turn 1), 3/14/27 spring-forward
    expect(crewOn("11/1/26")).toMatchObject({
      slot1: "Jaimes",
      slot2: "Brett",
    });
    // 3/14/27 is 20 weeks after 10/25/26 → turn 20 ≡ turn 0
    expect(crewOn("3/14/27")).toMatchObject({ slot1: "Ben", slot2: "Doug" });
  });

  it("makes special weekday services sign-up only", () => {
    expect(crewOn("12/24/26", [SEED], "special")).toEqual({
      slot1: null,
      slot2: null,
      source: "signup",
    });
  });
});

describe("crewForTurn — other team sizes", () => {
  it("N=2 serves both every week", () => {
    expect(crewForTurn(["A", "B"], 0)).toEqual(["A", "B"]);
    expect(crewForTurn(["A", "B"], 7).sort()).toEqual(["A", "B"]);
  });

  it("N even keeps pairs for a cycle, then shifts so partners change", () => {
    const m = ["A", "B", "C", "D"];
    expect([0, 1, 2, 3].map((t) => crewForTurn(m, t).join(""))).toEqual([
      "AB",
      "CD",
      "BC",
      "DA",
    ]);
    // still fair: each person twice in 4 turns
    const counts = {};
    [0, 1, 2, 3].forEach((t) =>
      crewForTurn(m, t).forEach((p) => (counts[p] = (counts[p] || 0) + 1)),
    );
    expect(counts).toEqual({ A: 2, B: 2, C: 2, D: 2 });
  });

  it("N=6 works out a full fair cycle", () => {
    const m = ["A", "B", "C", "D", "E", "F"];
    const counts = {};
    for (let t = 0; t < 18; t++)
      crewForTurn(m, t).forEach((p) => (counts[p] = (counts[p] || 0) + 1));
    expect(Object.values(counts)).toEqual([6, 6, 6, 6, 6, 6]);
  });

  it("fewer than 2 core members → insufficient, no crash", () => {
    const one = [{ effectiveDate: "10/25/26", members: ["Ben"] }];
    expect(crewOn("11/8/26", one)).toEqual({
      slot1: null,
      slot2: null,
      source: "insufficient",
    });
    const none = [{ effectiveDate: "10/25/26", members: [] }];
    expect(crewOn("11/8/26", none).source).toBe("insufficient");
  });
});

describe("getEpochFor", () => {
  it("picks the latest epoch on or before the date regardless of order", () => {
    const later = { effectiveDate: "1/3/27", members: ["X", "Y"] };
    expect(getEpochFor("1/3/27", [later, SEED])).toBe(later);
    expect(getEpochFor("12/27/26", [later, SEED])).toBe(SEED);
    expect(getEpochFor("10/18/26", [later, SEED])).toBeNull();
  });
});

describe("buildNextEpoch", () => {
  it("a toggle before 10/25 updates the seeded epoch instead of touching 10/18", () => {
    const next = buildNextEpoch({
      epochs: [SEED],
      coreNames: ["Ben", "Doug", "Jaimes", "Brett", "Abbey", "Laila"],
      today: parseServiceDate("10/11/26"),
    });
    expect(next).toEqual({
      effectiveDate: "10/25/26",
      members: ["Ben", "Doug", "Jaimes", "Brett", "Abbey", "Laila"],
    });
  });

  it("takes effect on the first Sunday at least 7 days out", () => {
    // Wed 11/4/26 → +7 = 11/11 → first Sunday on/after = 11/15
    const next = buildNextEpoch({
      epochs: [SEED],
      coreNames: SEED.members,
      today: parseServiceDate("11/4/26"),
    });
    expect(next.effectiveDate).toBe("11/15/26");
    // A Sunday +7 is itself a Sunday
    expect(
      buildNextEpoch({
        epochs: [SEED],
        coreNames: SEED.members,
        today: parseServiceDate("11/8/26"),
      }).effectiveDate,
    ).toBe("11/15/26");
  });

  it("continues the cycle with whoever was due next", () => {
    // 11/15/26 is turn 3 of the seed → Doug+Jaimes were due
    const next = buildNextEpoch({
      epochs: [SEED],
      coreNames: SEED.members,
      today: parseServiceDate("11/4/26"),
    });
    expect(next.members.slice(0, 2)).toEqual(["Doug", "Jaimes"]);
    const epochs = [SEED, next];
    expect(crewOn("11/8/26", epochs)).toMatchObject({
      slot1: "Abbey",
      slot2: "Ben",
    });
    expect(crewOn("11/15/26", epochs)).toMatchObject({
      slot1: "Doug",
      slot2: "Jaimes",
    });
  });

  it("removing a member leaves earlier Sundays exactly as they were", () => {
    const next = buildNextEpoch({
      epochs: [SEED],
      coreNames: ["Ben", "Doug", "Jaimes", "Abbey"],
      today: parseServiceDate("11/4/26"),
    });
    expect(next.members).not.toContain("Brett");
    const epochs = [SEED, next];
    sundays("10/25/26", 3).forEach((d) =>
      expect(crewOn(d, epochs)).toEqual(crewOn(d, [SEED])),
    );
    const crew = crewOn("11/15/26", epochs);
    expect([crew.slot1, crew.slot2]).not.toContain("Brett");
  });

  it("adding a member appends them and they enter the rotation", () => {
    const next = buildNextEpoch({
      epochs: [SEED],
      coreNames: [...SEED.members, "Laila"],
      today: parseServiceDate("11/4/26"),
    });
    expect(next.members).toHaveLength(6);
    expect(next.members[5]).toBe("Laila");
    const seen = new Set();
    sundays("11/15/26", 6).forEach((d) => {
      const c = crewOn(d, [SEED, next]);
      seen.add(c.slot1);
      seen.add(c.slot2);
    });
    expect(seen.has("Laila")).toBe(true);
  });

  it("with no epochs, starts from the core list as given", () => {
    expect(
      buildNextEpoch({
        epochs: [],
        coreNames: ["A", "B", "C"],
        today: parseServiceDate("11/4/26"),
      }),
    ).toEqual({ effectiveDate: "11/15/26", members: ["A", "B", "C"] });
  });
});
