import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, TablesUpdate } from '@/lib/db/database.types'
import { normalizeName } from './normalize'

type Db = SupabaseClient<Database>
type Status = Database['public']['Enums']['hackathon_status']
type Precision = Database['public']['Enums']['location_precision']

/** Everything an admin may change on the edit page. */
export type AdminPatch = {
  name?: string
  description?: string | null
  start_at?: string
  end_at?: string
  timezone?: string
  format?: Database['public']['Enums']['hackathon_format']
  venue_name?: string | null
  address?: string | null
  city?: string | null
  country_code?: string | null
  lat?: number | null
  lng?: number | null
  location_precision?: Precision | null
  url?: string | null
  registration_url?: string | null
  registration_deadline?: string | null
  themes?: string[]
  eligibility?: string | null
  price_cents?: number | null
  currency?: string
  prizes?: string | null
  capacity?: number | null
  organizer_name?: string | null
}

export type ModerationResult = { id: string; slug: string; city: string | null }

const RETURNING = 'id, slug, city'

/**
 * Moderation decision. Nothing else writes `status` on an existing row, so a
 * decision made here survives every later seed and import run.
 */
export async function setStatus(
  db: Db,
  id: string,
  status: Status
): Promise<ModerationResult> {
  const { data, error } = await db
    .from('hackathons')
    .update({ status })
    .eq('id', id)
    .select(RETURNING)
    .single()

  if (error) throw error
  return data
}

/**
 * Hand correction. Stamping `edited_at` is what protects the change: from here
 * on automated writes may only fill columns that are still empty.
 */
export async function updateByAdmin(
  db: Db,
  id: string,
  patch: AdminPatch
): Promise<ModerationResult> {
  const { lat, lng, location_precision, ...columns } = patch

  const update: TablesUpdate<'hackathons'> = {
    ...columns,
    edited_at: new Date().toISOString(),
  }

  if (patch.name != null) update.name_normalized = normalizeName(patch.name)

  if (lat !== undefined || lng !== undefined) {
    const hasPoint = lat != null && lng != null
    update.location = hasPoint ? `SRID=4326;POINT(${lng} ${lat})` : null
    update.location_precision = hasPoint ? (location_precision ?? 'city') : null
  } else if (location_precision !== undefined) {
    update.location_precision = location_precision
  }

  const { data, error } = await db
    .from('hackathons')
    .update(update)
    .eq('id', id)
    .select(RETURNING)
    .single()

  if (error) throw error
  return data
}
