/** Normalize a person's name for comparison (lowercase, no punctuation). */
export function normalizePersonName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** True when two names likely refer to the same person (exact or reordered tokens). */
export function namesLikelySamePerson(a: string, b: string): boolean {
  const left = normalizePersonName(a);
  const right = normalizePersonName(b);
  if (!left || !right) return false;
  if (left === right) return true;
  const leftTokens = left.split(" ").sort();
  const rightTokens = right.split(" ").sort();
  if (leftTokens.length !== rightTokens.length) return false;
  return leftTokens.every((token, i) => token === rightTokens[i]);
}
