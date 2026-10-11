import {
  slotKeyForIndex,
  labelForElement,
  formatSongDetails,
  applySelectionsToElements,
} from "./serviceElements.js";

const elements = [
  { id: "a", type: "song_hymn", content: "Opening Hymn:" },
  { id: "b", type: "liturgy", content: "Greeting" },
  { id: "c", type: "song_hymn", content: "Hymn of the Day:" },
  { id: "d", type: "liturgical_song", content: "Kyrie & Hymn of Praise" },
  { id: "e", type: "song_hymn", content: "Sending Song:" },
];

describe("slotKeyForIndex", () => {
  test("builds the song_N slot key", () => {
    expect(slotKeyForIndex(0)).toBe("song_0");
    expect(slotKeyForIndex(2)).toBe("song_2");
  });
});

describe("labelForElement", () => {
  test("returns the bare label from an unfilled line", () => {
    expect(labelForElement({ content: "Opening Hymn:" })).toBe("Opening Hymn");
  });

  test("returns the same label after a song has been written into the line", () => {
    expect(
      labelForElement({
        content: "Opening Hymn: Amazing Grace #123 (Cranberry)",
      }),
    ).toBe("Opening Hymn");
  });

  test("handles a missing content field", () => {
    expect(labelForElement({})).toBe("");
  });
});

describe("formatSongDetails", () => {
  test("formats a hymn with number and hymnal", () => {
    expect(
      formatSongDetails({
        type: "hymn",
        title: "Amazing Grace",
        number: "123",
        hymnal: "cranberry",
      }),
    ).toBe("Amazing Grace #123 (Cranberry)");
  });

  test("formats a contemporary song with an author", () => {
    expect(
      formatSongDetails({
        type: "contemporary",
        title: "Build My Life",
        author: "Pat Barrett",
      }),
    ).toBe("Build My Life - Pat Barrett");
  });

  test("formats a contemporary song without an author", () => {
    expect(
      formatSongDetails({ type: "contemporary", title: "Build My Life" }),
    ).toBe("Build My Life");
  });
});

describe("applySelectionsToElements", () => {
  const hymn = (title, number) => ({
    type: "hymn",
    title,
    number,
    hymnal: "cranberry",
  });

  test("REGRESSION X1: a blank middle slot does not shift later songs up", () => {
    const result = applySelectionsToElements(elements, {
      song_0: hymn("Amazing Grace", "123"),
      song_2: hymn("How Great Thou Art", "789"),
    });

    expect(result[0].content).toBe(
      "Opening Hymn: Amazing Grace #123 (Cranberry)",
    );
    expect(result[2].content).toBe(
      "Hymn of the Day: <Awaiting Song Selection>",
    );
    expect(result[4].content).toBe(
      "Sending Song: How Great Thou Art #789 (Cranberry)",
    );
  });

  test("leaves non-song elements untouched", () => {
    const result = applySelectionsToElements(elements, {});
    expect(result[1]).toEqual(elements[1]);
    expect(result[3]).toEqual(elements[3]);
  });

  test("never treats a liturgical_song as a selectable slot", () => {
    const result = applySelectionsToElements(elements, {
      song_0: hymn("A", "1"),
      song_1: hymn("B", "2"),
      song_2: hymn("C", "3"),
    });
    expect(result[3].content).toBe("Kyrie & Hymn of Praise");
    expect(result[3].selection).toBeUndefined();
  });

  test("numbers slots like the picker: a song_contemporary line is not a slot", () => {
    const withContemporary = [
      { type: "song_contemporary", content: "Praise Song:" },
      { type: "song_hymn", content: "Opening Hymn:" },
    ];
    const result = applySelectionsToElements(withContemporary, {
      song_0: hymn("Amazing Grace", "123"),
    });
    expect(result[0]).toEqual(withContemporary[0]);
    expect(result[1].content).toBe(
      "Opening Hymn: Amazing Grace #123 (Cranberry)",
    );
  });

  test("stores the label on the selection as `content`", () => {
    const result = applySelectionsToElements(elements, {
      song_0: hymn("Amazing Grace", "123"),
    });
    expect(result[0].selection.content).toBe("Opening Hymn");
    expect(result[0].selection.title).toBe("Amazing Grace");
  });

  test("clears a slot whose selection was removed", () => {
    const filled = applySelectionsToElements(elements, {
      song_0: hymn("Amazing Grace", "123"),
    });
    const cleared = applySelectionsToElements(filled, {});
    expect(cleared[0].content).toBe("Opening Hymn: <Awaiting Song Selection>");
    expect(cleared[0].selection).toBeNull();
  });

  test("returns an empty array when elements is missing", () => {
    expect(applySelectionsToElements(null, {})).toEqual([]);
  });
});
