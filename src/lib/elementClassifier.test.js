import {
  classifyLine,
  suggestTermForLine,
  ELEMENT_TYPES,
} from "./elementClassifier.js";
import { getStandardServiceElements } from "@/components/ui/PastorServiceInput.jsx";

describe("classifyLine", () => {
  test("classifies hymn slots that the worship team must fill", () => {
    expect(classifyLine("Opening Hymn:")).toBe(ELEMENT_TYPES.SONG_HYMN);
    expect(classifyLine("Hymn of the Day:")).toBe(ELEMENT_TYPES.SONG_HYMN);
    expect(classifyLine("Sending Song:")).toBe(ELEMENT_TYPES.SONG_HYMN);
  });

  test("classifies recurring liturgical songs, which are never selected", () => {
    expect(classifyLine("Kyrie & Hymn of Praise")).toBe(
      ELEMENT_TYPES.LITURGICAL_SONG,
    );
    expect(classifyLine("Gospel Acclamation - Alleluia (pg. 102)")).toBe(
      ELEMENT_TYPES.LITURGICAL_SONG,
    );
    expect(classifyLine("The Lord's Prayer-Sung")).toBe(
      ELEMENT_TYPES.LITURGICAL_SONG,
    );
  });

  test("does not treat the spoken Lord's Prayer as a song", () => {
    expect(classifyLine("The Lord's Prayer")).toBe(ELEMENT_TYPES.LITURGY);
  });

  test("classifies readings and messages", () => {
    expect(classifyLine("Gospel Reading:")).toBe(ELEMENT_TYPES.READING);
    expect(classifyLine("Sermon:")).toBe(ELEMENT_TYPES.MESSAGE);
  });

  test("treats a children's message as liturgy, not a sermon", () => {
    expect(classifyLine("Children's Message")).toBe(ELEMENT_TYPES.LITURGY);
  });

  test("REGRESSION: a hymn slot is never demoted to a liturgical song", () => {
    // "Opening Hymn" used to live in the liturgical-song vocabulary, so a
    // fuzzy match could file a real slot as a non-selectable song.
    expect(classifyLine("Openning Hymn:")).toBe(ELEMENT_TYPES.SONG_HYMN);
    expect(classifyLine("Opening Hymn")).toBe(ELEMENT_TYPES.SONG_HYMN);
  });

  test("falls back to liturgy for an unrecognized line", () => {
    expect(classifyLine("Prelude & Lighting of Candles")).toBe(
      ELEMENT_TYPES.LITURGY,
    );
  });
});

describe("suggestTermForLine", () => {
  test("suggests the properly written term for a near miss", () => {
    expect(suggestTermForLine("Kyriie")?.suggestion).toBe("Kyrie");
    expect(suggestTermForLine("Annoucements")?.suggestion).toBe(
      "Announcements",
    );
  });

  test("REGRESSION: a misspelled hymn slot is suggested as the hymn slot", () => {
    const match = suggestTermForLine("Openng Hymn");
    expect(match?.suggestion).toBe("Opening Hymn");
    expect(classifyLine(match.suggestion)).toBe(ELEMENT_TYPES.SONG_HYMN);
  });

  test("offers nothing for a line that already contains a known term", () => {
    expect(suggestTermForLine("Greeting")).toBeNull();
    expect(suggestTermForLine("Opening Hymn:")).toBeNull();
  });

  test("offers nothing for an unrelated line", () => {
    expect(suggestTermForLine("Prelude & Lighting of Candles")).toBeNull();
    expect(suggestTermForLine("")).toBeNull();
  });
});

describe("template round-trip", () => {
  // The authored templates are the contract. If the classifier and the
  // templates ever disagree, one of them is wrong -- this catches it.
  test("every authored template line classifies to its authored type", () => {
    const templates = getStandardServiceElements("1/5/25");
    const mismatches = [];

    Object.entries(templates).forEach(([serviceType, elements]) => {
      elements.forEach((element) => {
        const derived = classifyLine(element.content);
        if (derived !== element.type) {
          mismatches.push(
            `${serviceType}: "${element.content}" authored=${element.type} derived=${derived}`,
          );
        }
      });
    });

    expect(mismatches).toEqual([]);
  });
});
