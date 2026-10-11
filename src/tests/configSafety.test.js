/**
 * @jest-environment node
 */
import fs from "fs";
import path from "path";
import * as worshipAssignments from "../app/api/worship-assignments/route";

jest.mock("@/lib/mongodb", () => ({
  __esModule: true,
  default: Promise.resolve({}),
}));

describe("config safety", () => {
  test("SECURITY: next.config does not hand MONGODB_URI to the bundler", () => {
    const config = fs.readFileSync(
      path.join(__dirname, "../../next.config.mjs"),
      "utf8",
    );
    // Next inlines `env` values into any bundle that references them
    expect(config).not.toMatch(/env\s*:\s*\{[^}]*MONGODB_URI/s);
  });

  test("worship-assignments has no PUT writing to an undefined database", () => {
    expect(worshipAssignments.PUT).toBeUndefined();
  });
});
