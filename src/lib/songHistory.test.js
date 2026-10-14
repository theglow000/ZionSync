import {
  normalizeTitle,
  findPreviousUse,
  verseLines,
  notesToCopy,
  describePreviousUse,
} from "./songHistory";

const svc = (date, ...songs) => ({
  date,
  selections: Object.fromEntries(
    songs.map(([title, notes = ""], i) => [`song_${i}`, { title, notes }]),
  ),
});

describe("normalizeTitle", () => {
  test("ignores case, spacing and punctuation", () => {
    expect(normalizeTitle("Shine, Jesus Shine")).toBe(
      normalizeTitle(" shine jesus, SHINE! "),
    );
    expect(normalizeTitle("My Jesus ")).toBe(normalizeTitle("My Jesus"));
  });
});

describe("findPreviousUse", () => {
  const docs = [
    svc("2/8/26", ["This Little Light of Mine", "Verses 1 and 2"]),
    svc("3/22/26", ["Something Else"]),
    svc("12/20/26", ["This little light of mine"]),
    svc("1/18/26", ["This Little Light of Mine", "Older"]),
  ];

  test("returns the latest service strictly before this one", () => {
    expect(
      findPreviousUse(docs, "This Little Light of Mine", "10/18/26"),
    ).toEqual({ date: "2/8/26", notes: "Verses 1 and 2" });
  });

  test("a later service is not 'previous', and the service itself is skipped", () => {
    expect(
      findPreviousUse(docs, "this little light of mine", "2/8/26"),
    ).toEqual({ date: "1/18/26", notes: "Older" });
  });

  test("is fluid: a team adding the song in between changes the answer", () => {
    const later = [...docs, svc("11/15/26", ["This Little Light of Mine"])];
    expect(
      findPreviousUse(later, "This Little Light of Mine", "12/20/26").date,
    ).toBe("11/15/26");
  });

  test("null when the song has no earlier service, or no title", () => {
    expect(findPreviousUse(docs, "Unknown Song", "12/20/26")).toBeNull();
    expect(findPreviousUse(docs, "", "12/20/26")).toBeNull();
  });

  test("years compare as dates, not text", () => {
    const d = [svc("12/28/25", ["A"]), svc("1/4/26", ["A"])];
    expect(findPreviousUse(d, "A", "2/1/26").date).toBe("1/4/26");
  });
});

describe("verseLines", () => {
  test("keeps only the lines about verses, verbatim", () => {
    expect(
      verseLines("Last sung June 29, 2025.\nVerses 1, 3, 4\nLaila on drums"),
    ).toEqual(["Verses 1, 3, 4"]);
    expect(verseLines("All verses")).toEqual(["All verses"]);
    expect(verseLines("")).toEqual([]);
  });
});

describe("notesToCopy", () => {
  test("drops hand-typed last-sung lines, keeps the rest", () => {
    expect(
      notesToCopy("Last sung February 8, 2026.\nOnly one verse; sing twice."),
    ).toBe("Only one verse; sing twice.");
    expect(notesToCopy("Last used January 18, 2026.")).toBe("");
  });
});

describe("describePreviousUse", () => {
  const prev = { date: "2/8/26", notes: "" };

  test("past use reads 'Last sung' with the church-day name", () => {
    expect(describePreviousUse(prev, "10/13/26")).toEqual({
      verb: "Last sung",
      date: "February 8, 2026",
      dayName: "5th Sunday of Epiphany",
    });
  });

  test("a use still ahead of today reads 'Scheduled'", () => {
    const p = { date: "11/15/26", notes: "" };
    expect(describePreviousUse(p, "10/13/26").verb).toBe("Scheduled");
  });

  test("today's service counts as sung", () => {
    expect(describePreviousUse(prev, "2/8/26").verb).toBe("Last sung");
  });

  test("a plain weekday has no day name", () => {
    expect(
      describePreviousUse({ date: "10/14/26", notes: "" }, "10/20/26").dayName,
    ).toBeNull();
  });
});
