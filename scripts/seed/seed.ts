import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { config } from 'dotenv'
import { parse } from 'csv-parse/sync'

config({ path: '.env.local' })
config()

async function main() {
  const { createAdminClient } = await import('@/lib/db/supabase')
  const { upsertHackathon } = await import('@/lib/hackathons/upsert')
  const { csvRowSchema } = await import('@/lib/validation/schemas')
  const { geocode } = await import('../import/lib/geocode')

  const db = createAdminClient()
  const csvPath = join(process.cwd(), 'scripts/seed/hackathons.csv')
  const rows: Record<string, string>[] = parse(readFileSync(csvPath, 'utf8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })

  const counts = { inserted: 0, updated: 0, merged: 0, skipped: 0, geocoded: 0 }
  const pending: string[] = []

  for (const [index, raw] of rows.entries()) {
    const cleaned = Object.fromEntries(
      Object.entries(raw).filter(([, value]) => value !== '')
    )

    // The CSV carries deadlines as bare dates. Read them as the end of that day
    // in the event's own offset, taken from its start.
    const deadline = cleaned.registration_deadline
    if (typeof deadline === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
      const offset = String(cleaned.start_at).slice(-6)
      cleaned.registration_deadline = `${deadline}T23:59:00${offset}`
    }

    // Dates we could not confirm on the organiser's page wait for review
    // instead of going straight onto the map.
    const confirmed = cleaned.date_confidence === 'confirmed'
    const parsed = csvRowSchema.safeParse(cleaned)

    if (!parsed.success) {
      counts.skipped++
      const fields = Object.keys(parsed.error.flatten().fieldErrors).join(', ')
      console.warn(`row ${index + 2} (${raw.name ?? '?'}): invalid [${fields}]`)
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
        console.warn(`row ${index + 2} (${row.name}): no coordinates, skipped`)
        continue
      }
      counts.geocoded++
    }

    const result = await upsertHackathon(db, {
      ...row,
      lat: point?.lat ?? null,
      lng: point?.lng ?? null,
      location_precision: point?.precision ?? null,
      source: 'manual',
      source_url: row.source_url ?? row.url ?? null,
      status: confirmed ? 'published' : 'pending',
    })
    counts[result.action]++
    if (!confirmed) pending.push(row.name)
  }

  console.log(
    `seed: ${counts.inserted} inserted, ${counts.updated} updated, ` +
      `${counts.merged} merged, ${counts.skipped} skipped, ${counts.geocoded} geocoded`
  )
  if (pending.length > 0) {
    console.log(
      `${pending.length} rows are waiting for review because their date is not confirmed:`
    )
    for (const name of pending) console.log(`  - ${name}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
