import { z } from 'zod'

export const NEEDS_LOCATION =
  'Zverejniť sa dá len podujatie so súradnicami. Doplňte polohu v úprave a skúste znova.'

/** The Postgres check constraint that guards published on-site rows. */
export function isMissingLocation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === '23514' &&
    String((error as { message?: string }).message ?? '').includes(
      'hackathons_published_needs_location'
    )
  )
}

const FIELD_LABELS: Record<string, string> = {
  name: 'názov',
  description: 'popis',
  start_at: 'začiatok',
  end_at: 'koniec',
  timezone: 'časové pásmo',
  format: 'formát',
  venue_name: 'miesto konania',
  address: 'adresa',
  city: 'mesto',
  country_code: 'krajina',
  lat: 'poloha',
  lng: 'poloha',
  location_precision: 'poloha',
  url: 'web hackathonu',
  registration_url: 'odkaz na registráciu',
  registration_deadline: 'uzávierka registrácie',
  themes: 'témy',
  eligibility: 'pre koho',
  price_cents: 'vstupné',
  currency: 'mena',
  prizes: 'ceny',
  capacity: 'kapacita',
  organizer_name: 'organizátor',
  recurrence: 'opakovanie',
  status: 'stav',
}

/** Names the rejected fields in Slovak instead of echoing zod's English. */
export function invalidFieldsMessage(error: z.ZodError): string {
  const labels = Object.keys(z.flattenError(error).fieldErrors).map(
    (key) => FIELD_LABELS[key] ?? key
  )
  return `Skontrolujte polia: ${[...new Set(labels)].join(', ')}.`
}
