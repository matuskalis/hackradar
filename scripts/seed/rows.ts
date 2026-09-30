import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'csv-parse/sync'

export type SeedRow = { file: string; number: number; raw: Record<string, string> }

/**
 * Every CSV in the seed folder, in file-name order, one entry per data row.
 * Research batches drop in as separate files, so the name does not matter.
 * Rows are numbered from 1 within their file, not counting the header.
 */
export function readSeedRows(seedDir: string): SeedRow[] {
  const files = readdirSync(seedDir)
    .filter((file) => file.endsWith('.csv'))
    .sort()

  return files.flatMap((file) =>
    (
      parse(readFileSync(join(seedDir, file), 'utf8'), {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as Record<string, string>[]
    ).map((raw, index) => ({ file, number: index + 1, raw }))
  )
}

/**
 * An empty cell means "no value". The CSV also carries deadlines as bare
 * dates; they are read as the end of that day in the event's own offset, taken
 * from its start.
 */
export function cleanRow(raw: Record<string, string>): Record<string, string> {
  const cleaned = Object.fromEntries(
    Object.entries(raw).filter(([, value]) => value !== '')
  )

  const deadline = cleaned.registration_deadline
  if (typeof deadline === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
    const offset = String(cleaned.start_at).slice(-6)
    cleaned.registration_deadline = `${deadline}T23:59:00${offset}`
  }

  return cleaned
}
