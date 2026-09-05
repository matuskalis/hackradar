import type { HackathonCard } from '@/lib/db/types'

export type PointProperties = {
  id: string
  slug: string
  name: string
  format: HackathonCard['format']
}

export type PointCollection = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  PointProperties
>

function toFeature(item: HackathonCard): GeoJSON.Feature<GeoJSON.Point, PointProperties> {
  return {
    type: 'Feature',
    id: item.id,
    geometry: { type: 'Point', coordinates: [item.lng!, item.lat!] },
    properties: {
      id: item.id,
      slug: item.slug,
      name: item.name,
      format: item.format,
    },
  }
}

/**
 * Splits results into the two map sources: exact venues, which cluster, and
 * city-level matches, which are drawn as an area because the point is only the
 * city centre.
 */
export function toSources(items: HackathonCard[]): {
  venues: PointCollection
  cities: PointCollection
} {
  const venues: GeoJSON.Feature<GeoJSON.Point, PointProperties>[] = []
  const cities: GeoJSON.Feature<GeoJSON.Point, PointProperties>[] = []

  for (const item of items) {
    if (item.lat == null || item.lng == null) continue
    ;(item.location_precision === 'city' ? cities : venues).push(toFeature(item))
  }

  return {
    venues: { type: 'FeatureCollection', features: venues },
    cities: { type: 'FeatureCollection', features: cities },
  }
}
