export type City = {
  slug: string
  name: string
  countryCode: 'SK' | 'CZ' | 'AT' | 'HU' | 'PL'
  lat: number
  lng: number
  radiusKm: number
}

/** Cities that get their own SEO landing page. */
export const CITIES: City[] = [
  { slug: 'bratislava', name: 'Bratislava', countryCode: 'SK', lat: 48.1486, lng: 17.1077, radiusKm: 50 },
  { slug: 'kosice', name: 'Košice', countryCode: 'SK', lat: 48.7164, lng: 21.2611, radiusKm: 50 },
  { slug: 'praha', name: 'Praha', countryCode: 'CZ', lat: 50.0755, lng: 14.4378, radiusKm: 50 },
  { slug: 'brno', name: 'Brno', countryCode: 'CZ', lat: 49.1951, lng: 16.6068, radiusKm: 50 },
  { slug: 'ostrava', name: 'Ostrava', countryCode: 'CZ', lat: 49.8209, lng: 18.2625, radiusKm: 50 },
  { slug: 'wien', name: 'Viedeň', countryCode: 'AT', lat: 48.2082, lng: 16.3738, radiusKm: 50 },
  { slug: 'graz', name: 'Graz', countryCode: 'AT', lat: 47.0707, lng: 15.4395, radiusKm: 50 },
  { slug: 'linz', name: 'Linz', countryCode: 'AT', lat: 48.3069, lng: 14.2858, radiusKm: 50 },
  { slug: 'budapest', name: 'Budapešť', countryCode: 'HU', lat: 47.4979, lng: 19.0402, radiusKm: 50 },
  { slug: 'warszawa', name: 'Varšava', countryCode: 'PL', lat: 52.2297, lng: 21.0122, radiusKm: 50 },
  { slug: 'krakow', name: 'Krakov', countryCode: 'PL', lat: 50.0647, lng: 19.945, radiusKm: 50 },
  { slug: 'wroclaw', name: 'Vroclav', countryCode: 'PL', lat: 51.1079, lng: 17.0385, radiusKm: 50 },
  { slug: 'poznan', name: 'Poznaň', countryCode: 'PL', lat: 52.4064, lng: 16.9252, radiusKm: 50 },
  { slug: 'gdansk', name: 'Gdansk', countryCode: 'PL', lat: 54.352, lng: 18.6466, radiusKm: 50 },
]

export const DEFAULT_CITY = CITIES[0]

export function findCity(slug: string): City | undefined {
  return CITIES.find((city) => city.slug === slug)
}
