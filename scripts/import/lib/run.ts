import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'
import { upsertHackathon } from '@/lib/hackathons/upsert'
import { geocode } from './geocode'
import { inRegion, type Importer } from './types'

type Db = SupabaseClient<Database>
type ImportError = { source_id: string | null; stage: string; message: string }

export type RunSummary = {
  found: number
  inserted: number
  updated: number
  merged: number
  skipped: number
  errors: ImportError[]
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Runs one importer end to end and records the attempt in import_runs. The run
 * row is written before any network call, so a total failure still leaves a
 * trace (and keeps the free-tier database from idling into a pause).
 */
export async function runImport(db: Db, importer: Importer): Promise<RunSummary> {
  const summary: RunSummary = {
    found: 0,
    inserted: 0,
    updated: 0,
    merged: 0,
    skipped: 0,
    errors: [],
  }

  const { data: run, error: runError } = await db
    .from('import_runs')
    .insert({ source: importer.source })
    .select('id')
    .single()
  if (runError) throw runError

  try {
    const items = importer.parse(await importer.fetchRaw())
    summary.found = items.length

    for (const item of items) {
      if (!inRegion(item)) {
        summary.skipped++
        continue
      }

      try {
        let point = item.lat != null && item.lng != null ? item : null

        if (!point && item.format !== 'online') {
          const found = await geocode(db, {
            address: item.address,
            city: item.city,
            country_code: item.country_code,
          })
          point = found
            ? { ...item, lat: found.lat, lng: found.lng, location_precision: found.precision }
            : null
        }

        if (!point && item.format !== 'online') {
          summary.skipped++
          summary.errors.push({
            source_id: item.source_id,
            stage: 'geocode',
            message: `no coordinates for "${item.city ?? item.name}"`,
          })
          continue
        }

        const result = await upsertHackathon(db, {
          ...item,
          lat: point?.lat ?? null,
          lng: point?.lng ?? null,
          location_precision: point?.location_precision ?? null,
          status: 'published',
        })
        summary[result.action]++
      } catch (error) {
        summary.errors.push({
          source_id: item.source_id,
          stage: 'upsert',
          message: message(error),
        })
      }
    }
  } catch (error) {
    summary.errors.push({ source_id: null, stage: 'fetch', message: message(error) })
  }

  await db
    .from('import_runs')
    .update({
      finished_at: new Date().toISOString(),
      found: summary.found,
      inserted: summary.inserted,
      updated: summary.updated + summary.merged,
      errors: summary.errors,
    })
    .eq('id', run.id)

  return summary
}
