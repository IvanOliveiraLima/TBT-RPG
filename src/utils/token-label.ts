/**
 * Shortens a token label to `max` characters while preserving the trailing
 * number that differentiates repeated monsters ("Goblin 3" → "Gob 3", not "Gob").
 * Without a trailing number, behaves as label.slice(0, max).
 */
export function shortenTokenLabel(label: string, max: number): string {
  const m = /^(.*?)\s+(\d+)$/.exec(label.trim())
  if (!m) return label.slice(0, max)
  const [, base, num] = m
  const room = Math.max(1, max - 1) // base gets max-1 chars; trailing number always appended in full
  return `${base!.slice(0, room)} ${num}`
}
