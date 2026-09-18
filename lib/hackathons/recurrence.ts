import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'
import { findDuplicate, linkToParent, upsertHackathon } from './upsert'

type Db = SupabaseClient<Database>
type Status = Database['public']['Enums']['hackathon_status']

/**
 * 52 weeks. Shifting by whole weeks keeps the weekday, which matters more than
 * the calendar date: hackathons are weekend events.
 */
const SHIFT_MS = 364 * 24 * 60 * 60 * 1000

/** Statuses that count as evidence the edition actually happened. */
const ROLLABLE: Status[] = ['published', 'cancelled']

export type Edition = {
  name: string
  start_at: string
  end_at: string
  registration_deadline?: string | null
}

export type ShiftedEdition = {
  name: string
  start_at: string
  end_at: string
  registration_deadline: string | null
}

function shift(value: string): string {
  return new Date(new Date(value).getTime() + SHIFT_MS).toISOString()
}

/**
 * A four-digit year at the end of a name is an edition label. Anywhere else it
 * can belong to the name itself ("Rakathon 2026 (Praha)" is a city node), so
 * only the trailing one is rewritten.
 */
function renameForYear(name: string, year: number): string {
  return name.replace(/\b(?:19|20)\d{2}$/, String(year))
}

/** The guessed next edition of an event. Pure; an admin confirms the dates. */
export function nextEdition(event: Edition): ShiftedEdition {
  const start_at = shift(event.start_at)

  return {
    name: renameForYear(event.name, new Date(start_at).getUTCFullYear()),
    start_at,
    end_at: shift(event.end_at),
    registration_deadline: event.registration_deadline
      ? shift(event.registration_deadline)
      : null,
  }
}

export type RollCandidate = {
  status: Status
  recurrence: string
  end_at: string
}

/**
 * Whether an event still owes us a next edition. Kept free of database calls so
 * the idempotency rule is testable on its own: `hasChild` is the whole memory
 * this decision has, and the unique index on `parent_id` backs it up.
 */
export function needsNextEdition(
  event: RollCandidate,
  hasChild: boolean,
  now: Date
): boolean {
  if (event.recurrence !== 'annual') return false
  if (!ROLLABLE.includes(event.status)) return false
  if (hasChild) return false
  return new Date(event.end_at).getTime() < now.getTime()
}

export type RollCounts = {
  candidates: number
  created: number
  linked: number
  skipped: number
}

/** A concurrent roll inserted the child first; the unique index caught it. */
function isAlreadyRolled(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === '23505' &&
    String((error as { message?: string }).message ?? '').includes(
      'hackathons_parent_id_idx'
    )
  )
}

/**
 * Creates the next edition of every annual event that has ended and has no
 * child yet, as a `pending` row for an admin to confirm. When the next edition
 * is already in the database it is linked to its parent instead, untouched.
 * Idempotent: a second run finds the children and creates nothing.
 */
export async function rollRecurringEvents(db: Db, now: Date): Promise<RollCounts> {
  // The admin view is the only read surface that hands out coordinates as
  // numbers; the table stores a geography PostgREST cannot unpack.
  const { data: candidates, error } = await db
    .from('hackathons_admin')
    .select('*')
    .eq('recurrence', 'annual')
    .in('status', ROLLABLE)
    .lt('end_at', now.toISOString())
  if (error) throw error

  const { data: children, error: childrenError } = await db
    .from('hackathons')
    .select('parent_id')
    .in(
      'parent_id',
      (candidates ?? []).map((row) => row.id!)
    )
  if (childrenError) throw childrenError

  const rolled = new Set((children ?? []).map((child) => child.parent_id))
  const counts: RollCounts = {
    candidates: candidates?.length ?? 0,
    created: 0,
    linked: 0,
    skipped: 0,
  }

  for (const row of candidates ?? []) {
    // The view mirrors the table, where these columns are not null.
    const id = row.id!
    const event = {
      name: row.name!,
      start_at: row.start_at!,
      end_at: row.end_at!,
      registration_deadline: row.registration_deadline,
    }

    if (
      !needsNextEdition(
        { status: row.status!, recurrence: row.recurrence!, end_at: event.end_at },
        rolled.has(id),
        now
      )
    ) {
      counts.skipped++
      continue
    }

    const input = {
      ...nextEdition(event),
      description: row.description,
      timezone: row.timezone!,
      format: row.format!,
      venue_name: row.venue_name,
      address: row.address,
      city: row.city,
      country_code: row.country_code,
      lat: row.lat,
      lng: row.lng,
      location_precision: row.location_precision,
      url: row.url,
      registration_url: row.registration_url,
      themes: row.themes ?? [],
      eligibility: row.eligibility,
      price_cents: row.price_cents,
      currency: row.currency,
      prizes: row.prizes,
      capacity: row.capacity,
      organizer_name: row.organizer_name,
      source: row.source!,
      // A fresh edition is not the same record at the source, and reusing the
      // parent's source_id would make the write path update the parent.
      source_id: null,
      source_url: row.source_url,
      status: 'pending' as const,
      recurrence: 'annual' as const,
      parent_id: id,
    }

    // Someone already added the real next edition. Writing the guess through
    // the write path would match it and overwrite its dates.
    const existing = await findDuplicate(db, input)
    if (existing) {
      await linkToParent(db, existing.id, id)
      rolled.add(id)
      counts.linked++
      continue
    }

    try {
      await upsertHackathon(db, input)
    } catch (error) {
      if (!isAlreadyRolled(error)) throw error
      counts.skipped++
      continue
    }

    rolled.add(id)
    counts.created++
  }

  return counts
}
