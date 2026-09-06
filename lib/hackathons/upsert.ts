import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables, TablesInsert } from '@/lib/db/database.types'
import { normalizeName, slugForEvent, urlKey } from './normalize'

export type HackathonInput = {
  name: string
  description?: string | null
  start_at: string
  end_at: string
  timezone: string
  format: Database['public']['Enums']['hackathon_format']
  venue_name?: string | null
  address?: string | null
  city?: string | null
  country_code?: string | null
  lat?: number | null
  lng?: number | null
  location_precision?: Database['public']['Enums']['location_precision'] | null
  url?: string | null
  registration_url?: string | null
  registration_deadline?: string | null
  themes?: string[]
  eligibility?: string | null
  price_cents?: number | null
  currency?: string | null
  prizes?: string | null
  capacity?: number | null
  organizer_name?: string | null
  source: Database['public']['Enums']['hackathon_source']
  source_id?: string | null
  source_url?: string | null
  status: Database['public']['Enums']['hackathon_status']
}

export type UpsertAction = 'inserted' | 'updated' | 'merged'
export type UpsertResult = { action: UpsertAction; id: string; slug: string }

type Db = SupabaseClient<Database>
type HackathonRow = Tables<'hackathons'>

const DAY_MS = 24 * 60 * 60 * 1000

/** Columns a merge from a second source is allowed to fill when ours is null. */
const MERGEABLE_COLUMNS = [
  'description',
  'venue_name',
  'address',
  'city',
  'country_code',
  'url',
  'registration_url',
  'registration_deadline',
  'eligibility',
  'price_cents',
  'prizes',
  'capacity',
  'organizer_name',
] as const

function toRow(input: HackathonInput): Omit<TablesInsert<'hackathons'>, 'slug'> {
  const hasPoint = input.lat != null && input.lng != null

  return {
    name: input.name,
    name_normalized: normalizeName(input.name),
    description: input.description ?? null,
    start_at: input.start_at,
    end_at: input.end_at,
    timezone: input.timezone,
    format: input.format,
    venue_name: input.venue_name ?? null,
    address: input.address ?? null,
    city: input.city ?? null,
    country_code: input.country_code ?? null,
    location: hasPoint ? `SRID=4326;POINT(${input.lng} ${input.lat})` : null,
    location_precision: hasPoint ? (input.location_precision ?? 'city') : null,
    url: input.url ?? null,
    registration_url: input.registration_url ?? null,
    registration_deadline: input.registration_deadline ?? null,
    themes: input.themes ?? [],
    eligibility: input.eligibility ?? null,
    price_cents: input.price_cents ?? null,
    currency: input.currency ?? 'EUR',
    prizes: input.prizes ?? null,
    capacity: input.capacity ?? null,
    organizer_name: input.organizer_name ?? null,
    source: input.source,
    source_id: input.source_id ?? null,
    source_url: input.source_url ?? null,
    status: input.status,
  }
}

async function freeSlug(db: Db, base: string): Promise<string> {
  for (let attempt = 1; attempt <= 20; attempt++) {
    const candidate = attempt === 1 ? base : `${base}-${attempt}`
    const { data, error } = await db
      .from('hackathons')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()
    if (error) throw error
    if (!data) return candidate
  }
  throw new Error(`no free slug for "${base}" after 20 attempts`)
}

type DuplicateCandidate = Pick<
  HackathonRow,
  'name_normalized' | 'registration_url' | 'url' | 'start_at' | 'city'
>

/**
 * Two records describe the same event when they start within a day of each
 * other and share either a normalized name or a registration host.
 *
 * Different cities are never the same event, even on the same date and
 * registration domain: one hackathon often runs parallel city editions that
 * share a signup page.
 */
export function isSameEvent(
  candidate: DuplicateCandidate,
  input: Pick<HackathonInput, 'name' | 'start_at' | 'registration_url' | 'url' | 'city'>
): boolean {
  const dayApart =
    Math.abs(
      new Date(candidate.start_at).getTime() - new Date(input.start_at).getTime()
    ) <= DAY_MS
  if (!dayApart) return false

  if (
    candidate.city != null &&
    input.city != null &&
    normalizeName(candidate.city) !== normalizeName(input.city)
  ) {
    return false
  }

  if (candidate.name_normalized === normalizeName(input.name)) return true

  const key = urlKey(input.registration_url ?? input.url)
  return key != null && urlKey(candidate.registration_url ?? candidate.url) === key
}

/** Loads same-week rows and returns the first one describing the same event. */
async function findDuplicate(
  db: Db,
  input: HackathonInput
): Promise<HackathonRow | null> {
  const start = new Date(input.start_at).getTime()

  const { data, error } = await db
    .from('hackathons')
    .select('*')
    .gte('start_at', new Date(start - DAY_MS).toISOString())
    .lte('start_at', new Date(start + DAY_MS).toISOString())
  if (error) throw error

  return (data ?? []).find((row) => isSameEvent(row, input)) ?? null
}

/**
 * The single write path for hackathons. Seed, importers and the public submit
 * form all go through here so slug generation and deduplication stay in one
 * place. Requires a service-role client; RLS grants no anonymous writes.
 */
export async function upsertHackathon(
  db: Db,
  input: HackathonInput
): Promise<UpsertResult> {
  const row = toRow(input)

  if (input.source_id) {
    const { data: bySource, error } = await db
      .from('hackathons')
      .select('id, slug')
      .eq('source', input.source)
      .eq('source_id', input.source_id)
      .maybeSingle()
    if (error) throw error

    if (bySource) {
      const { error: updateError } = await db
        .from('hackathons')
        .update(row)
        .eq('id', bySource.id)
      if (updateError) throw updateError
      return { action: 'updated', id: bySource.id, slug: bySource.slug }
    }
  }

  const duplicate = await findDuplicate(db, input)

  if (duplicate) {
    if (duplicate.source === input.source) {
      const { error } = await db
        .from('hackathons')
        .update(row)
        .eq('id', duplicate.id)
      if (error) throw error
      return { action: 'updated', id: duplicate.id, slug: duplicate.slug }
    }

    const filled: Record<string, unknown> = {}
    for (const column of MERGEABLE_COLUMNS) {
      if (duplicate[column] == null && row[column] != null) {
        filled[column] = row[column]
      }
    }
    if (duplicate.location == null && row.location != null) {
      filled.location = row.location
      filled.location_precision = row.location_precision
    }

    const extraSources = Array.isArray(duplicate.extra_sources)
      ? duplicate.extra_sources
      : []
    const alreadyRecorded = extraSources.some(
      (entry) =>
        typeof entry === 'object' &&
        entry !== null &&
        (entry as { source?: string }).source === input.source
    )

    const { error } = await db
      .from('hackathons')
      .update({
        ...filled,
        extra_sources: alreadyRecorded
          ? duplicate.extra_sources
          : [
              ...extraSources,
              {
                source: input.source,
                source_id: input.source_id ?? null,
                source_url: input.source_url ?? null,
              },
            ],
      })
      .eq('id', duplicate.id)
    if (error) throw error

    return { action: 'merged', id: duplicate.id, slug: duplicate.slug }
  }

  const slug = await freeSlug(db, slugForEvent(input.name, input.start_at))

  const { data, error } = await db
    .from('hackathons')
    .insert({ ...row, slug })
    .select('id, slug')
    .single()
  if (error) throw error

  return { action: 'inserted', id: data.id, slug: data.slug }
}
