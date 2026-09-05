import type { Database } from '@/lib/db/database.types'

export type NormalizedHackathon = {
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
  organizer_name?: string | null
  source: Database['public']['Enums']['hackathon_source']
  source_id: string
  source_url?: string | null
}

export type Importer = {
  source: Database['public']['Enums']['hackathon_source']
  fetchRaw: () => Promise<unknown>
  parse: (raw: unknown) => NormalizedHackathon[]
}

/** Countries the map covers. Anything else is dropped unless it is online. */
export const REGION = ['SK', 'CZ', 'AT', 'HU', 'PL', 'DE'] as const

export function inRegion(item: NormalizedHackathon): boolean {
  return (
    item.format === 'online' ||
    (item.country_code != null &&
      (REGION as readonly string[]).includes(item.country_code))
  )
}
