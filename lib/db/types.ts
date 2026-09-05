import type { Database, Tables } from './database.types'

export type Hackathon = Tables<'hackathons'>

/** One row as returned by the radius and bbox search functions. */
export type HackathonCard =
  Database['public']['Functions']['hackathons_within_radius']['Returns'][number]

export type HackathonFormat = Database['public']['Enums']['hackathon_format']
export type LocationPrecision = Database['public']['Enums']['location_precision']
