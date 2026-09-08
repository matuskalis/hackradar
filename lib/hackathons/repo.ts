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

/**
 * City pages and the sitemap are prerendered at build time. A database that is
 * unreachable then must not fail the whole deployment, so these two degrade to
 * an empty result and recover on the next revalidation. The city page still
 * works, because the map fetches its own data in the browser.
 *
 * getPublishedBySlug deliberately keeps throwing: a detail page with no event
 * should fail loudly rather than render as if the event did not exist.
 */
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

  if (error) {
    console.error('listUpcomingNear failed, rendering without initial data', error)
    return []
  }
  return data ?? []
}

export async function listPublishedSlugs() {
  const db = createAnonClient()
  const { data, error } = await db
    .from('hackathons_public')
    .select('slug, updated_at')
    // An event that has ended is no longer worth offering to a search engine.
    .gte('end_at', new Date().toISOString())
    .order('start_at', { ascending: true })

  if (error) {
    console.error('listPublishedSlugs failed, sitemap will list static routes only', error)
    return []
  }
  return data ?? []
}
