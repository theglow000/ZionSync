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
});
