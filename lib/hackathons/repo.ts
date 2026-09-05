import { createAnonClient } from '@/lib/db/supabase'
import type { HackathonCard } from '@/lib/db/types'

/** Published event by slug, or null. Reads the public view, so RLS applies. */
export async function getPublishedBySlug(slug: string) {
  const db = createAnonClient()
  const { data, error } = await db
    .from('hackathons_public')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function listUpcomingNear(
  center: { lat: number; lng: number },
  radiusKm: number
): Promise<HackathonCard[]> {
  const db = createAnonClient()
  const { data, error } = await db.rpc('hackathons_within_radius', {
    center_lat: center.lat,
    center_lng: center.lng,
    radius_km: radiusKm,
  })

  if (error) throw error
  return data ?? []
}

export async function listPublishedSlugs() {
  const db = createAnonClient()
  const { data, error } = await db
    .from('hackathons_public')
    .select('slug, updated_at')
    .order('start_at', { ascending: true })

  if (error) throw error
  return data ?? []
}
