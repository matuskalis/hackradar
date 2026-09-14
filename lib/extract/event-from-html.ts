import { parse } from 'node-html-parser'

export type ExtractedFormat = 'onsite' | 'online' | 'hybrid'
export type ExtractedCountry = 'SK' | 'CZ' | 'AT' | 'HU' | 'PL' | 'DE'
export type ExtractedCurrency = 'EUR' | 'CZK' | 'PLN' | 'HUF'

/** Subset of `submitSchema` that a public event page can realistically supply. */
export type ExtractedFields = {
  name?: string
  description?: string
  start_at?: string
  end_at?: string
  timezone?: string
  format?: ExtractedFormat
  venue_name?: string
  address?: string
  city?: string
  country_code?: ExtractedCountry
  url?: string
  registration_url?: string
  organizer_name?: string
  price_cents?: number
  currency?: ExtractedCurrency
}

export type ExtractionResult = {
  fields: ExtractedFields
  missing: string[]
  warnings: string[]
}

const ALWAYS_REQUIRED = [
  'name',
  'start_at',
  'end_at',
  'timezone',
  'format',
  'url',
  'organizer_name',
] as const

const ALLOWED_CURRENCIES: ExtractedCurrency[] = ['EUR', 'CZK', 'PLN', 'HUF']

/** Every country the submit schema accepts has a single civil timezone. */
const COUNTRY_TIMEZONES: Record<ExtractedCountry, string> = {
  SK: 'Europe/Bratislava',
  CZ: 'Europe/Prague',
  AT: 'Europe/Vienna',
  HU: 'Europe/Budapest',
  PL: 'Europe/Warsaw',
  DE: 'Europe/Berlin',
}

/** English, local and neighbouring-language names, plus alpha-2 and alpha-3. */
const COUNTRY_NAMES: Record<ExtractedCountry, string[]> = {
  SK: [
    'sk', 'svk', 'slovakia', 'slovak republic', 'slovensko', 'slovenska republika',
    'slowakei', 'slovensko sr', 'szlovakia', 'slowacja', 'slovacchia',
  ],
  CZ: [
    'cz', 'cze', 'czechia', 'czech republic', 'cesko', 'ceska republika',
    'tschechien', 'tschechische republik', 'csehorszag', 'czechy',
  ],
  AT: [
    'at', 'aut', 'austria', 'osterreich', 'oesterreich', 'rakusko', 'rakousko',
    'ausztria', 'austriacka',
  ],
  HU: [
    'hu', 'hun', 'hungary', 'magyarorszag', 'ungarn', 'madarsko', 'wegry',
  ],
  PL: [
    'pl', 'pol', 'poland', 'polska', 'polen', 'polsko', 'lengyelorszag',
  ],
  DE: [
    'de', 'deu', 'ger', 'germany', 'deutschland', 'nemecko', 'nemecky',
    'niemcy', 'nemetorszag', 'federal republic of germany',
  ],
}

/**
 * JSON inside a <script> is raw text, so entities survive JSON.parse and reach
 * us undecoded. Values read through the DOM are already decoded by the parser,
 * which is also what decodes here; `<` is escaped first so a stray angle
 * bracket in a description is not swallowed as markup.
 */
export function decodeEntities(value: string): string {
  if (!value.includes('&')) return value
  return parse(value.replace(/</g, '&lt;')).text
}

function clean(value: string | undefined | null): string | undefined {
  if (value == null) return undefined
  const text = value.replace(/\s+/g, ' ').trim()
  return text.length > 0 ? text : undefined
}

function cleanJsonLd(value: unknown): string | undefined {
  const text = firstString(value)
  return text != null ? clean(decodeEntities(text)) : undefined
}

function foldName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/** Country name or code to ISO alpha-2, limited to the countries we publish. */
export function countryCodeFromName(value: string | undefined | null): ExtractedCountry | undefined {
  if (!value) return undefined
  const folded = foldName(value)
  if (!folded) return undefined
  for (const [code, names] of Object.entries(COUNTRY_NAMES)) {
    if (names.includes(folded)) return code as ExtractedCountry
  }
  return undefined
}

/** schema.org eventAttendanceMode, with or without the URL prefix. */
export function attendanceModeToFormat(value: unknown): ExtractedFormat | undefined {
  const text = firstString(value)?.toLowerCase()
  if (!text) return undefined
  if (text.includes('mixed')) return 'hybrid'
  if (text.includes('online')) return 'online'
  if (text.includes('offline')) return 'onsite'
  return undefined
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

/** JSON-LD values are routinely a string, an array, or an object with a name. */
function firstString(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstString(item)
      if (found != null) return found
    }
    return undefined
  }
  const record = asRecord(value)
  if (record) return firstString(record.name)
  return undefined
}

function typesOf(record: Record<string, unknown>): string[] {
  const raw = record['@type']
  const list = Array.isArray(raw) ? raw : [raw]
  return list
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.split(/[/#]/).pop() ?? item)
    .map((item) => item.toLowerCase())
}

function isEventType(record: Record<string, unknown>): boolean {
  return typesOf(record).some((type) => type === 'event' || type.endsWith('event') || type === 'hackathon')
}

/** Walks arrays, `@graph` and nested objects so a buried Event is still found. */
function collectEvents(value: unknown, into: Record<string, unknown>[], depth = 0): void {
  if (depth > 6 || into.length > 20) return
  if (Array.isArray(value)) {
    for (const item of value) collectEvents(item, into, depth + 1)
    return
  }
  const record = asRecord(value)
  if (!record) return
  if (isEventType(record)) into.push(record)
  for (const child of Object.values(record)) {
    if (typeof child === 'object' && child !== null) collectEvents(child, into, depth + 1)
  }
}

const HAS_OFFSET = /(?:Z|[+-]\d{2}:?\d{2})$/i

type NormalizedDate = { value: string; hasOffset: boolean }

/**
 * Keeps the source instant untouched. A local time without an offset is a real
 * ambiguity, so it is reported instead of being pinned to a guessed zone.
 */
function normalizeDate(raw: string | undefined): NormalizedDate | undefined {
  const text = clean(raw)?.replace(/\s/g, '')
  if (!text || !/^\d{4}-\d{2}-\d{2}/.test(text)) return undefined
  if (!HAS_OFFSET.test(text)) return { value: text, hasOffset: false }
  const withColon = text.replace(/([+-]\d{2})(\d{2})$/, '$1:$2')
  return { value: withColon, hasOffset: true }
}

function absoluteUrl(raw: string | undefined, pageUrl: string): string | undefined {
  const text = clean(raw)
  if (!text) return undefined
  try {
    return new URL(text, pageUrl).toString()
  } catch {
    return undefined
  }
}

function priceToCents(value: unknown): number | undefined {
  const raw = typeof value === 'number' ? value : Number(clean(firstString(value))?.replace(',', '.'))
  if (!Number.isFinite(raw) || raw < 0) return undefined
  return Math.round(raw * 100)
}

function currencyOf(value: unknown): ExtractedCurrency | undefined {
  const code = clean(firstString(value))?.toUpperCase()
  return ALLOWED_CURRENCIES.find((allowed) => allowed === code)
}

type MetaReader = (names: string[]) => string | undefined

function readFromJsonLd(
  event: Record<string, unknown>,
  fields: ExtractedFields,
  pageUrl: string
): void {
  fields.name ??= cleanJsonLd(event.name)
  fields.description ??= cleanJsonLd(event.description)
  fields.organizer_name ??= cleanJsonLd(event.organizer)
  fields.url ??= absoluteUrl(cleanJsonLd(event.url), pageUrl)
  fields.format ??= attendanceModeToFormat(event.eventAttendanceMode)

  const locations = Array.isArray(event.location) ? event.location : [event.location]
  for (const entry of locations) {
    const place = asRecord(entry)
    if (!place) {
      fields.venue_name ??= cleanJsonLd(entry)
      continue
    }
    if (typesOf(place).includes('virtuallocation')) {
      fields.format ??= 'online'
      fields.registration_url ??= absoluteUrl(cleanJsonLd(place.url), pageUrl)
      continue
    }
    fields.venue_name ??= cleanJsonLd(place.name)
    const address = asRecord(place.address)
    if (address) {
      fields.address ??= cleanJsonLd(address.streetAddress)
      fields.city ??= cleanJsonLd(address.addressLocality)
      fields.country_code ??= countryCodeFromName(cleanJsonLd(address.addressCountry))
    } else {
      fields.address ??= cleanJsonLd(place.address)
    }
  }

  const offers = Array.isArray(event.offers) ? event.offers : [event.offers]
  for (const entry of offers) {
    const offer = asRecord(entry)
    if (!offer) continue
    fields.price_cents ??= priceToCents(offer.price)
    fields.currency ??= currencyOf(offer.priceCurrency)
    fields.registration_url ??= absoluteUrl(cleanJsonLd(offer.url), pageUrl)
  }
}

function readFromMeta(meta: MetaReader, root: ReturnType<typeof parse>, fields: ExtractedFields): void {
  fields.name ??= clean(meta(['og:title', 'twitter:title'])) ?? clean(root.querySelector('title')?.text)
  fields.description ??= clean(meta(['og:description', 'description', 'twitter:description']))
  fields.organizer_name ??= clean(meta(['og:site_name', 'author']))
}

function readTimeElements(root: ReturnType<typeof parse>): string[] {
  return root
    .querySelectorAll('time[datetime]')
    .map((node) => node.getAttribute('datetime'))
    .filter((value): value is string => Boolean(clean(value)))
}

/**
 * Deterministic, non-executing extraction of an event from a page.
 * JSON-LD first, then OpenGraph and meta, then `<time datetime>` for dates.
 */
export function extractEventFromHtml(html: string, pageUrl: string): ExtractionResult {
  const fields: ExtractedFields = {}
  const warnings: string[] = []
  const root = parse(html)

  const events: Record<string, unknown>[] = []
  for (const script of root.querySelectorAll('script[type="application/ld+json"]')) {
    const raw = script.rawText.trim()
    if (!raw) continue
    try {
      collectEvents(JSON.parse(raw), events)
    } catch {
      warnings.push('one <script type="application/ld+json"> block is not valid JSON and was skipped')
    }
  }

  const dateSources: Record<'start_at' | 'end_at', string | undefined> = {
    start_at: undefined,
    end_at: undefined,
  }

  for (const event of events) {
    readFromJsonLd(event, fields, pageUrl)
    dateSources.start_at ??= firstString(event.startDate)
    dateSources.end_at ??= firstString(event.endDate)
  }

  const meta: MetaReader = (names) => {
    for (const name of names) {
      const node =
        root.querySelector(`meta[property="${name}"]`) ?? root.querySelector(`meta[name="${name}"]`)
      const content = clean(node?.getAttribute('content'))
      if (content) return content
    }
    return undefined
  }

  readFromMeta(meta, root, fields)
  fields.url ??= absoluteUrl(meta(['og:url']), pageUrl)
  fields.url ??= absoluteUrl(root.querySelector('link[rel="canonical"]')?.getAttribute('href'), pageUrl)
  fields.url ??= absoluteUrl(pageUrl, pageUrl)

  dateSources.start_at ??= meta(['event:start_time', 'article:published_time'])
  dateSources.end_at ??= meta(['event:end_time'])

  if (dateSources.start_at == null || dateSources.end_at == null) {
    const times = readTimeElements(root)
    dateSources.start_at ??= times[0]
    dateSources.end_at ??= times[1]
  }

  for (const key of ['start_at', 'end_at'] as const) {
    const normalized = normalizeDate(dateSources[key])
    if (!normalized) continue
    fields[key] = normalized.value
    if (!normalized.hasOffset) {
      warnings.push(`${key} "${normalized.value}" has no UTC offset, set the timezone by hand`)
    }
  }

  if (fields.country_code == null) {
    const metaCountry = countryCodeFromName(meta(['geo.country', 'og:locality:country']))
    if (metaCountry) fields.country_code = metaCountry
  }
  if (fields.country_code != null) {
    fields.timezone = COUNTRY_TIMEZONES[fields.country_code]
  }
  if (fields.registration_url === fields.url) {
    delete fields.registration_url
  }

  const required: string[] = [...ALWAYS_REQUIRED]
  if (fields.format !== 'online') required.push('city', 'country_code')
  const missing = required.filter((key) => fields[key as keyof ExtractedFields] == null)

  return { fields, missing, warnings }
}
