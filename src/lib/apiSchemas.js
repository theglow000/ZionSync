/**
 * Request-body schemas for mutating API routes.
 *
 * These exist primarily to stop NoSQL operator injection: request bodies are
 * JSON, so a field the code assumes is a string can arrive as
 * {"$ne": null}, which matches every document. Parsing with zod forces the
 * value to a real string (or rejects it) before it can reach a query.
 *
 * zod strips unknown keys by default, so stray operator fields are dropped.
 */
import { z } from "zod";
import { createValidationResponse } from "./validation.js";

const safeString = z.string().trim().min(1).max(200);

export const nameOnlySchema = z.object({ name: safeString });

export const signupSchema = z.object({
  date: safeString,
  name: safeString,
});

export const idOnlySchema = z.object({ id: safeString });

/**
 * @returns {{success: true, data: object} | {success: false, response: Response}}
 */
export function parseBody(schema, body) {
  const result = schema.safeParse(body);
  if (result.success) return { success: true, data: result.data };
  return {
    success: false,
    response: createValidationResponse(result.error.issues, 400),
  };
}

// ---- A/V team ----

const serviceTime = safeString.nullable().optional();

export const coreToggleSchema = z.object({
  name: safeString,
  core: z.boolean(),
});

export const avServiceKeySchema = z.object({
  date: safeString,
  serviceTime,
});

// `position` becomes part of a field name (team_member_N), so it is limited to
// the three real slots. `name` may be null or omitted to clear a slot (copying
// an assignment to a new service time sends empty slots without a name).
export const avTeamPostSchema = z.discriminatedUnion("type", [
  avServiceKeySchema.extend({
    type: z.literal("signup"),
    position: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    name: safeString.nullable().default(null),
  }),
  avServiceKeySchema.extend({
    type: z.literal("completed"),
    completed: z.boolean(),
  }),
]);

// ---- Shared guard for routes without a per-route schema ----

/** True if any object key anywhere in `value` is a Mongo operator ($...). */
export function hasMongoOperator(value) {
  if (Array.isArray(value)) return value.some(hasMongoOperator);
  if (value && typeof value === "object") {
    return Object.entries(value).some(
      ([key, v]) => key.startsWith("$") || hasMongoOperator(v),
    );
  }
  return false;
}

/**
 * Read a JSON request body, rejecting malformed JSON and any body that carries
 * a Mongo operator key. Use in place of `await request.json()`.
 * @returns {Promise<{success: true, data: any} | {success: false, response: Response}>}
 */
export async function readJsonBody(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return {
      success: false,
      response: createValidationResponse(
        [{ message: "Request body must be valid JSON" }],
        400,
      ),
    };
  }
  if (hasMongoOperator(body)) {
    return {
      success: false,
      response: createValidationResponse(
        [{ message: "Request body may not contain database operators" }],
        400,
      ),
    };
  }
  return { success: true, data: body };
}
