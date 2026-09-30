import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { config } from 'dotenv'
import { cleanRow, readSeedRows } from './rows'

config({ path: '.env.local' })
config()

type KnownPoint = { lat: number; lng: number; precision: 'venue' | 'city' }

async function main() {
  const { createAdminClient } = await import('@/lib/db/supabase')
  const { upsertHackathon } = await import('@/lib/hackathons/upsert')
  const { csvRowSchema } = await import('@/lib/validation/schemas')
  const { geocode, geocodeCacheKey } = await import('@/lib/geocode')

  const db = createAdminClient()
  // Every CSV in the seed folder is loaded, so research batches can be dropped
  // in as separate files. Duplicates across files are merged by upsertHackathon.
  const seedDir = join(process.cwd(), 'scripts/seed')
  const rows = readSeedRows(seedDir)
  const files = [...new Set(rows.map((row) => row.file))]
  console.log(`seed: reading ${rows.length} rows from ${files.join(', ')}`)

  // Coordinates Photon already returned for these addresses are committed next
  // to the CSVs, so a fresh clone seeds without touching the network. They are
  // inserted only where the cache has no entry yet. An address that is not in
  // the file is looked up live, exactly as before, and recorded at the end.
  const geocodesPath = join(seedDir, 'geocodes.json')
  const known: Record<string, KnownPoint> = JSON.parse(readFileSync(geocodesPath, 'utf8'))
  const { error: preloadError } = await db
    .from('geocode_cache')
    .upsert(
      Object.entries(known).map(([query, point]) => ({ query, ...point })),
      { onConflict: 'query', ignoreDuplicates: true }
    )
  if (preloadError) throw preloadError
  console.log(`seed: ${Object.keys(known).length} coordinates preloaded from geocodes.json`)

  const counts = { inserted: 0, updated: 0, merged: 0, skipped: 0, geocoded: 0 }
  const pending: string[] = []
  let recorded = 0

  for (const { file, number, raw } of rows) {
    const where = `${file} row ${number}`
    const cleaned = cleanRow(raw)

    // Every seeded row goes on the map. Dates we could not confirm on the
    // organiser's page are still listed, and reported below so they can be
    // checked against the next edition's announcement.
    const confirmed = cleaned.date_confidence === 'confirmed'
    // A row was only rolled forward to a guessed date because the series was
    // evidenced as annual, so an estimated date implies annual recurrence.
    // An explicit `recurrence` column wins.
    const estimated = cleaned.date_confidence === 'estimated'
    const parsed = csvRowSchema.safeParse(cleaned)

    if (!parsed.success) {
      counts.skipped++
      const fields = Object.keys(parsed.error.flatten().fieldErrors).join(', ')
      console.warn(`${where} (${raw.name ?? '?'}): invalid [${fields}]`)
      continue
    }

    const row = parsed.data
    let point = null

    if (row.format !== 'online') {
      point = await geocode(db, {
        address: row.address,
        city: row.city,
        country_code: row.country_code,
      })
      if (!point) {
        counts.skipped++
        console.warn(`${where} (${row.name}): no coordinates, skipped`)
        continue
      }
      counts.geocoded++

      const key = geocodeCacheKey(row)
      if (key && !known[key]) {
        known[key] = { lat: point.lat, lng: point.lng, precision: point.precision }
        recorded++
      }
    }

    const result = await upsertHackathon(db, {
      ...row,
      lat: point?.lat ?? null,
      lng: point?.lng ?? null,
      location_precision: point?.precision ?? null,
      source: 'manual',
      source_url: row.source_url ?? row.url ?? null,
      status: 'published',
      recurrence: row.recurrence ?? (estimated ? 'annual' : 'none'),
    })
    counts[result.action]++
    if (!confirmed) pending.push(row.name)
  }

  console.log(
    `seed: ${counts.inserted} inserted, ${counts.updated} updated, ` +
      `${counts.merged} merged, ${counts.skipped} skipped, ${counts.geocoded} geocoded`
  )

  if (recorded > 0) {
    const sorted = Object.fromEntries(
      Object.entries(known).sort(([a], [b]) => (a < b ? -1 : 1))
    )
    writeFileSync(geocodesPath, JSON.stringify(sorted, null, 2) + '\n')
    console.log(
      `seed: ${recorded} new addresses were looked up and written to geocodes.json, commit it with the CSV`
    )
  }

  if (pending.length > 0) {
    console.log(`${pending.length} published rows have an unconfirmed date:`)
    for (const name of pending) console.log(`  - ${name}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
