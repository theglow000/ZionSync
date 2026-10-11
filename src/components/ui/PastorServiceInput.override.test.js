import { parseServiceContent } from "./PastorServiceInput.jsx";

describe("parseServiceContent - pastor type overrides", () => {
  const date = "1/5/25";
  const serviceContent = "Opening Hymn:\nSpecial Music:";

  test("REGRESSION: an override survives the worship team rewriting the line", () => {
    let elements = parseServiceContent(serviceContent, date, []);

    // Pastor corrects "Special Music:" from liturgy to song_hymn
    const i = elements.findIndex((e) => e.content === "Special Music:");
    elements[i] = { ...elements[i], type: "song_hymn" };

    // Worship team fills both songs: element.content is rewritten,
    // but the service-level content string is not.
    elements = elements.map((e) =>
      e.type !== "song_hymn"
        ? e
        : {
            ...e,
            content: `${e.content.split(":")[0].trim()}: Amazing Grace #123 (Cranberry)`,
          },
    );

    // Pastor reopens the modal
    const reloaded = parseServiceContent(serviceContent, date, elements);

    expect(reloaded.filter((e) => e.type === "song_hymn")).toHaveLength(2);
    expect(reloaded.find((e) => e.content === "Special Music:").type).toBe(
      "song_hymn",
    );
  });

  test("an unmodified line still matches on its full text", () => {
    const elements = parseServiceContent(serviceContent, date, []);
    const reloaded = parseServiceContent(serviceContent, date, elements);
    expect(reloaded.map((e) => e.id)).toEqual(elements.map((e) => e.id));
  });

  test("two filled lines with the same label keep separate elements", () => {
    const content = "Hymn:\nGreeting\nHymn:";
    let elements = parseServiceContent(content, date, []);
    elements = elements.map((e, n) =>
      e.type !== "song_hymn" ? e : { ...e, content: `Hymn: Song ${n}` },
    );
    const reloaded = parseServiceContent(content, date, elements);
    const ids = reloaded.filter((e) => e.type === "song_hymn").map((e) => e.id);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });

  test("an exact match is never taken by an earlier line's label match", () => {
    const stored = [
      { id: "id1", type: "song_hymn", content: "Hymn: Y", selection: "y" },
      { id: "id2", type: "song_hymn", content: "Hymn: A", selection: "a" },
    ];
    const reloaded = parseServiceContent("Hymn: X\nHymn: Y", date, stored);
    expect(reloaded.map((e) => e.id)).toEqual(["id2", "id1"]);
    expect(reloaded[1].selection).toBe("y");
  });

  test("stored elements without an id can each still be matched", () => {
    const stored = [
      { type: "song_hymn", content: "Special Music:" },
      { type: "song_hymn", content: "Postlude" },
    ];
    const reloaded = parseServiceContent(
      "Special Music:\nPostlude",
      date,
      stored,
    );
    expect(reloaded.map((e) => e.type)).toEqual(["song_hymn", "song_hymn"]);
  });

  test("legacy elements saved without ids get distinct ids", () => {
    const stored = [
      { type: "song_hymn", content: "Hymn:" },
      { type: "song_hymn", content: "Hymn:" },
    ];
    const ids = parseServiceContent("Hymn:\nHymn:", date, stored).map(
      (e) => e.id,
    );
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(2);
  });

  test("a generated id never duplicates a stored element's id", () => {
    const stored = [
      { id: "1525_song_hymn_Hymn_2", type: "liturgy", content: "Greeting" },
    ];
    const ids = parseServiceContent("Greeting\nHymn:\nHymn:", date, stored).map(
      (e) => e.id,
    );
    expect(new Set(ids).size).toBe(3);
  });
});
