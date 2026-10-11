/**
 * @jest-environment node
 */
import {
  nameOnlySchema,
  signupSchema,
  idOnlySchema,
  parseBody,
  readJsonBody,
} from "./apiSchemas.js";

describe("parseBody", () => {
  test("accepts a well-formed body", () => {
    const result = parseBody(nameOnlySchema, { name: "Ben" });
    expect(result.success).toBe(true);
    expect(result.data.name).toBe("Ben");
  });

  test("SECURITY: rejects a Mongo operator object in place of a string", () => {
    const result = parseBody(nameOnlySchema, { name: { $ne: null } });
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
  });

  test("SECURITY: rejects an operator object on a signup date", () => {
    const result = parseBody(signupSchema, { date: { $gt: "" }, name: "Ben" });
    expect(result.success).toBe(false);
  });

  test("rejects an empty name", () => {
    expect(parseBody(nameOnlySchema, { name: "" }).success).toBe(false);
  });

  test("rejects a missing body", () => {
    expect(parseBody(nameOnlySchema, null).success).toBe(false);
  });

  test("rejects an over-long name", () => {
    expect(parseBody(nameOnlySchema, { name: "x".repeat(201) }).success).toBe(
      false,
    );
  });

  test("strips unknown keys rather than passing them to Mongo", () => {
    const result = parseBody(nameOnlySchema, { name: "Ben", $where: "1==1" });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ name: "Ben" });
  });

  test("idOnlySchema accepts a string id", () => {
    expect(parseBody(idOnlySchema, { id: "svc-123" }).success).toBe(true);
  });
});

describe("readJsonBody", () => {
  const jsonReq = (body) =>
    new Request("http://localhost/api/x", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    });

  test("passes an ordinary body through unchanged", async () => {
    const body = { date: "10/18/26", selections: [{ title: "Hymn", n: 1 }] };
    const result = await readJsonBody(jsonReq(body));
    expect(result).toEqual({ success: true, data: body });
  });

  test("SECURITY: rejects an operator key at the top level", async () => {
    const result = await readJsonBody(jsonReq({ $where: "1==1" }));
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
  });

  test("SECURITY: rejects an operator nested inside arrays and objects", async () => {
    const body = { date: "1/1/26", elements: [{ content: { $ne: null } }] };
    expect((await readJsonBody(jsonReq(body))).success).toBe(false);
  });

  test("allows a dollar sign inside string values", async () => {
    const body = { notes: "costs $5", title: "$ign" };
    expect((await readJsonBody(jsonReq(body))).success).toBe(true);
  });

  test("rejects malformed JSON with 400", async () => {
    const result = await readJsonBody(jsonReq("{not json"));
    expect(result.success).toBe(false);
    expect(result.response.status).toBe(400);
  });
});
