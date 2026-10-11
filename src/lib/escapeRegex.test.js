import { escapeRegex } from "./escapeRegex.js";

describe("escapeRegex", () => {
  test("leaves an ordinary title untouched", () => {
    expect(escapeRegex("Amazing Grace")).toBe("Amazing Grace");
  });

  test("escapes regex metacharacters in a title", () => {
    expect(escapeRegex("Come, Thou Fount (v.2)")).toBe(
      "Come, Thou Fount \\(v\\.2\\)",
    );
  });

  test("an escaped title matches only itself", () => {
    const re = new RegExp(`^${escapeRegex("Rejoice! (Reprise)")}$`, "i");
    expect(re.test("Rejoice! (Reprise)")).toBe(true);
    expect(re.test("Rejoice Reprise")).toBe(false);
  });

  test("handles an empty string", () => {
    expect(escapeRegex("")).toBe("");
  });
});
