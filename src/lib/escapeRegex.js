/**
 * Escapes regex metacharacters so user-supplied text can be used inside a
 * RegExp literally. Song titles routinely contain parentheses, periods and
 * exclamation marks, which otherwise change the pattern's meaning -- or,
 * with nested quantifiers, hang the request.
 */
export function escapeRegex(value) {
  return String(value ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
