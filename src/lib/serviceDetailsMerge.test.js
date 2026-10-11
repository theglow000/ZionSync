import { mergeServiceDetails } from "./serviceDetailsMerge";

const doc = (date, elements, extra = {}) => ({ date, elements, ...extra });

describe("mergeServiceDetails", () => {
  test("REGRESSION: keys the API's array by date, not by array index", () => {
    const merged = mergeServiceDetails({}, [
      doc("10/18/26", [{ type: "liturgy", content: "Greeting" }]),
      doc("10/25/26", []),
    ]);
    expect(Object.keys(merged).sort()).toEqual(["10/18/26", "10/25/26"]);
    expect(merged["0"]).toBeUndefined();
  });

  test("refreshes an existing date with the server's elements", () => {
    const prev = {
      "10/18/26": doc("10/18/26", [
        {
          type: "song_hymn",
          content: "Opening Hymn: <Awaiting Song Selection>",
        },
      ]),
    };
    const merged = mergeServiceDetails(prev, [
      doc("10/18/26", [
        {
          type: "song_hymn",
          content: "Opening Hymn: Amazing Grace #123 (Cranberry)",
        },
      ]),
    ]);
    expect(merged["10/18/26"].elements[0].content).toBe(
      "Opening Hymn: Amazing Grace #123 (Cranberry)",
    );
  });

  test("a line the pastor deleted does not come back", () => {
    const prev = {
      "10/18/26": doc("10/18/26", [
        { type: "liturgy", content: "Greeting" },
        { type: "reading", content: "Second Reading: Romans 8" },
      ]),
    };
    const merged = mergeServiceDetails(prev, [
      doc("10/18/26", [{ type: "liturgy", content: "Greeting" }]),
    ]);
    expect(merged["10/18/26"].elements).toEqual([
      { type: "liturgy", content: "Greeting" },
    ]);
  });

  test("keeps dates the server did not return and fields it did not send", () => {
    const prev = {
      "10/11/26": doc("10/11/26", [], { title: "Old" }),
      "10/18/26": doc("10/18/26", [], { localFlag: true }),
    };
    const merged = mergeServiceDetails(prev, [doc("10/18/26", [])]);
    expect(merged["10/11/26"].title).toBe("Old");
    expect(merged["10/18/26"].localFlag).toBe(true);
  });

  test("ignores entries without a date and a non-array response", () => {
    expect(mergeServiceDetails({ a: 1 }, [{ elements: [] }])).toEqual({ a: 1 });
    expect(mergeServiceDetails({ a: 1 }, null)).toEqual({ a: 1 });
  });
});
