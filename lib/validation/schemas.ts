import { z } from 'zod'
import { ELIGIBILITY_SLUGS, RADIUS_OPTIONS, THEME_SLUGS } from '@/lib/taxonomy'

const formatEnum = z.enum(['onsite', 'online', 'hybrid'])
const themeEnum = z.enum(THEME_SLUGS)
const eligibilityEnum = z.enum(ELIGIBILITY_SLUGS)
const countryEnum = z.enum(['SK', 'CZ', 'AT', 'HU', 'PL', 'DE'])

const isoDateTime = z.iso.datetime({ offset: true })

const csvList = <T extends z.ZodType<string, string>>(inner: T) =>
  z
    .string()
    .transform((value) => value.split(',').map((part) => part.trim()).filter(Boolean))
    .pipe(z.array(inner))

const sharedFilters = {
  from: isoDateTime.optional(),
  to: isoDateTime.optional(),
  format: csvList(formatEnum).optional(),
  themes: csvList(themeEnum).optional(),
  free: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  eligibility: eligibilityEnum.optional(),
}

const radiusQuery = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce
    .number()
    .refine((value) => (RADIUS_OPTIONS as readonly number[]).includes(value), {
      message: `radius must be one of ${RADIUS_OPTIONS.join(', ')}`,
    })
    .default(50),
  ...sharedFilters,
})

const bboxQuery = z.object({
  bbox: z
    .string()
    .transform((value) => value.split(',').map(Number))
    .refine(
      (parts) => parts.length === 4 && parts.every((n) => Number.isFinite(n)),
      { message: 'bbox must be "minLng,minLat,maxLng,maxLat"' }
    )
    .refine(
      ([minLng, minLat, maxLng, maxLat]) =>
        minLng < maxLng &&
        minLat < maxLat &&
        minLng >= -180 &&
        maxLng <= 180 &&
        minLat >= -90 &&
        maxLat <= 90,
      { message: 'bbox is out of range or has swapped corners' }
    ),
  ...sharedFilters,
})

export const hackathonsQuerySchema = z.union([bboxQuery, radiusQuery])
export type HackathonsQuery = z.infer<typeof hackathonsQuerySchema>

export const geocodeQuerySchema = z.object({
  q: z.string().trim().min(2).max(80),
})

export const submitSchema = z
  .object({
    name: z.string().trim().min(3).max(120),
    description: z.string().trim().max(4000).optional(),
    start_at: isoDateTime,
    end_at: isoDateTime,
    timezone: z.string().trim().min(3).max(64),
    format: formatEnum,
    venue_name: z.string().trim().max(160).optional(),
    address: z.string().trim().max(240).optional(),
    city: z.string().trim().min(2).max(80).optional(),
    country_code: countryEnum.optional(),
    url: z.url(),
    registration_url: z.url().optional(),
    registration_deadline: isoDateTime.optional(),
    themes: z.array(themeEnum).max(5).default([]),
    eligibility: eligibilityEnum.optional(),
    price_cents: z.number().int().min(0).max(10_000_00).optional(),
    currency: z.enum(['EUR', 'CZK', 'PLN', 'HUF']).default('EUR'),
    prizes: z.string().trim().max(500).optional(),
    capacity: z.number().int().min(1).max(100_000).optional(),
    organizer_name: z.string().trim().min(2).max(120),
    // Hidden field. Real people leave it empty; bots fill everything in.
    website: z.string().max(0).optional(),
  })
  .refine((value) => new Date(value.end_at) >= new Date(value.start_at), {
    message: 'end_at must not be before start_at',
    path: ['end_at'],
  })
  .refine(
    (value) => value.format === 'online' || (value.city != null && value.country_code != null),
    { message: 'city and country_code are required for on-site events', path: ['city'] }
  )

export type SubmitInput = z.infer<typeof submitSchema>

/** One row of scripts/seed/hackathons.csv. */
export const csvRowSchema = z
  .object({
    name: z.string().trim().min(3),
    description: z.string().trim().optional(),
    start_at: isoDateTime,
    end_at: isoDateTime,
    timezone: z.string().trim().min(3),
    format: formatEnum,
    venue_name: z.string().trim().optional(),
    address: z.string().trim().optional(),
    city: z.string().trim().optional(),
    country_code: countryEnum.optional(),
    url: z.url().optional(),
    registration_url: z.url().optional(),
    registration_deadline: isoDateTime.optional(),
    themes: z
      .string()
      .transform((value) => value.split('|').map((part) => part.trim()).filter(Boolean))
      .pipe(z.array(themeEnum))
      .default([]),
    eligibility: eligibilityEnum.optional(),
    price_cents: z.coerce.number().int().min(0).optional(),
    currency: z.enum(['EUR', 'CZK', 'PLN', 'HUF']).default('EUR'),
    prizes: z.string().trim().optional(),
    capacity: z.coerce.number().int().min(1).optional(),
    organizer_name: z.string().trim().optional(),
    source_url: z.url().optional(),
  })
  .refine((value) => new Date(value.end_at) >= new Date(value.start_at), {
    message: 'end_at must not be before start_at',
    path: ['end_at'],
  })

export type CsvRow = z.infer<typeof csvRowSchema>
