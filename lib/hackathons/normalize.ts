const DIACRITICS = /[̀-ͯ]/g

/** URL-safe slug: "Hackathon Košice 2027" -> "hackathon-kosice-2027" */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Comparison key for deduplication. Drops diacritics, punctuation, edition
 * numbers, years and whitespace, so "Hack Košice 2027" and "HackKošice #8"
 * collapse to the same value. Whitespace goes too because sources disagree on
 * whether the name is one word or two.
 */
export function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .replace(/\b(19|20)\d{2}\b/g, ' ')
    .replace(/\bv?\d+(\.\d+)?\b/g, ' ')
    .replace(/[^a-z0-9]+/g, '')
}

/** Registration host without "www.", or null when the URL is unusable. */
export function urlHost(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    return new URL(value).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

export function slugForEvent(name: string, startAt: string): string {
  const year = new Date(startAt).getUTCFullYear()
  const base = slugify(name)
  return base.endsWith(String(year)) ? base : `${base}-${year}`
}
