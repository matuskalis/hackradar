'use client'

import dynamic from 'next/dynamic'
import { useActionState, useRef, useState } from 'react'
import {
  geocodeAddressAction,
  saveHackathonAction,
  type AdminActionState,
} from '@/app/admin/actions'
import { createHackathonAction } from '@/app/admin/new/actions'
import { MapSkeleton } from '@/components/map/HackMap'
import { DEFAULT_CITY } from '@/lib/cities'
import { ELIGIBILITY, FORMATS, THEMES } from '@/lib/taxonomy'
import type { ThemeSlug } from '@/lib/taxonomy'
import { cn } from '@/lib/utils'

const MarkerMap = dynamic(() => import('./MarkerMap'), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full border border-line">
      <MapSkeleton />
    </div>
  ),
})

const COUNTRIES = {
  SK: 'Slovensko',
  CZ: 'Česko',
  AT: 'Rakúsko',
  HU: 'Maďarsko',
  PL: 'Poľsko',
  DE: 'Nemecko',
} as const

const field = 'w-full border border-line bg-ground px-3 py-2 text-sm text-ink'
const chip =
  'border border-line px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted transition-colors hover:border-ink hover:text-ink'
const chipOn = 'border-ink bg-ink text-ground hover:bg-ink hover:text-ground'
const secondaryButton =
  'border border-line px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-muted transition-colors hover:border-ink hover:text-ink disabled:opacity-50'

export type EditableHackathon = {
  /** Null while creating: the row does not exist yet. */
  id: string | null
  name: string
  description: string | null
  start_at: string
  end_at: string
  timezone: string
  format: 'onsite' | 'online' | 'hybrid'
  venue_name: string | null
  address: string | null
  city: string | null
  country_code: string | null
  lat: number | null
  lng: number | null
  location_precision: 'venue' | 'city' | null
  url: string | null
  registration_url: string | null
  registration_deadline: string | null
  themes: string[]
  eligibility: string | null
  price_cents: number | null
  currency: string
  prizes: string | null
  capacity: number | null
  organizer_name: string | null
}

const initial: AdminActionState = { error: null, ok: null }

type Props = {
  event: EditableHackathon
  /** Fields the extractor could not find; highlighted so nothing ships empty. */
  missing?: string[]
  /** The page the values were extracted from, stored as `source_url`. */
  sourceUrl?: string | null
}

export function HackathonEditForm({ event, missing = [], sourceUrl = null }: Props) {
  const creating = event.id == null
  const [state, formAction, pending] = useActionState(
    creating ? createHackathonAction : saveHackathonAction,
    initial
  )
  const [format, setFormat] = useState(event.format)
  const [themes, setThemes] = useState<string[]>(event.themes)
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(
    event.lat != null && event.lng != null ? { lat: event.lat, lng: event.lng } : null
  )
  const [precision, setPrecision] = useState(event.location_precision ?? 'city')
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState<string | null>(null)
  const form = useRef<HTMLFormElement>(null)

  async function geocodeAddress() {
    if (!form.current) return
    const data = new FormData(form.current)
    const text = (key: string) => {
      const value = data.get(key)
      return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
    }

    setGeocoding(true)
    setGeocodeError(null)
    const result = await geocodeAddressAction({
      address: text('address'),
      city: text('city'),
      country_code: text('country_code'),
    })
    setGeocoding(false)

    if (!result.ok) {
      setGeocodeError(result.error)
      return
    }
    setPoint({ lat: result.lat, lng: result.lng })
    setPrecision(result.precision)
  }

  /** Dragging the pin is the most precise statement about a venue there is. */
  function movePin(lat: number, lng: number) {
    setPoint({ lat, lng })
    setPrecision('venue')
  }

  const box = (name: string) => cn(field, missing.includes(name) && 'border-accent')
  const hint = (name: string) =>
    missing.includes(name) ? (
      <span className="label text-accent">Nenájdené, doplňte</span>
    ) : null

  return (
    <form ref={form} action={formAction} className="flex flex-col gap-5">
      {event.id != null && <input type="hidden" name="id" value={event.id} />}
      {creating && sourceUrl != null && (
        <input type="hidden" name="source_url" value={sourceUrl} />
      )}

      {creating && (
        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="label">
            Stav po uložení *
          </label>
          <select id="status" name="status" defaultValue="published" className={field}>
            <option value="published">Zverejniť hneď</option>
            <option value="pending">Nechať na schválenie</option>
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="label">
          Názov * {hint('name')}
        </label>
        <input
          id="name"
          name="name"
          required
          minLength={3}
          defaultValue={event.name}
          className={box('name')}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="label">
          Popis
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={event.description ?? ''}
          className={field}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="start_at" className="label">
            Začiatok (ISO 8601) * {hint('start_at')}
          </label>
          <input
            id="start_at"
            name="start_at"
            required
            defaultValue={event.start_at}
            className={cn(box('start_at'), 'data')}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="end_at" className="label">
            Koniec (ISO 8601) * {hint('end_at')}
          </label>
          <input
            id="end_at"
            name="end_at"
            required
            defaultValue={event.end_at}
            className={cn(box('end_at'), 'data')}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="timezone" className="label">
            Časové pásmo * {hint('timezone')}
          </label>
          <input
            id="timezone"
            name="timezone"
            required
            defaultValue={event.timezone}
            className={box('timezone')}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="label">Formát * {hint('format')}</span>
        <div className="flex flex-wrap gap-2">
          {Object.entries(FORMATS).map(([slug, text]) => (
            <button
              key={slug}
              type="button"
              onClick={() => setFormat(slug as typeof format)}
              className={cn(chip, format === slug && chipOn)}
            >
              {text}
            </button>
          ))}
        </div>
        <input type="hidden" name="format" value={format} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="venue_name" className="label">
            Miesto konania
          </label>
          <input
            id="venue_name"
            name="venue_name"
            defaultValue={event.venue_name ?? ''}
            className={field}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="address" className="label">
            Adresa
          </label>
          <input
            id="address"
            name="address"
            defaultValue={event.address ?? ''}
            className={field}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="city" className="label">
            Mesto {hint('city')}
          </label>
          <input
            id="city"
            name="city"
            defaultValue={event.city ?? ''}
            className={box('city')}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="country_code" className="label">
            Krajina {hint('country_code')}
          </label>
          <select
            id="country_code"
            name="country_code"
            defaultValue={event.country_code ?? ''}
            className={box('country_code')}
          >
            <option value="">—</option>
            {Object.entries(COUNTRIES).map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="label">Poloha</span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="data text-xs text-muted">
              {point
                ? `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)} · ${precision}`
                : 'bez súradníc'}
            </span>
            <button
              type="button"
              onClick={geocodeAddress}
              disabled={geocoding}
              className={secondaryButton}
            >
              {geocoding ? 'Hľadám…' : 'Geokódovať adresu'}
            </button>
            {point && (
              <button
                type="button"
                onClick={() => setPoint(null)}
                className={secondaryButton}
              >
                Zmazať pin
              </button>
            )}
          </div>
        </div>

        <MarkerMap
          lat={point?.lat ?? DEFAULT_CITY.lat}
          lng={point?.lng ?? DEFAULT_CITY.lng}
          onMove={movePin}
        />
        <p className="text-xs text-muted">
          Potiahnutím alebo kliknutím presuniete pin; presnosť sa nastaví na
          <span className="data"> venue</span>.
        </p>

        <input type="hidden" name="lat" value={point?.lat ?? ''} />
        <input type="hidden" name="lng" value={point?.lng ?? ''} />
        <input
          type="hidden"
          name="location_precision"
          value={point ? precision : ''}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="url" className="label">
            Web hackathonu {hint('url')}
          </label>
          <input
            id="url"
            name="url"
            type="url"
            defaultValue={event.url ?? ''}
            className={box('url')}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="registration_url" className="label">
            Odkaz na registráciu
          </label>
          <input
            id="registration_url"
            name="registration_url"
            type="url"
            defaultValue={event.registration_url ?? ''}
            className={field}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="registration_deadline" className="label">
            Uzávierka registrácie (ISO 8601)
          </label>
          <input
            id="registration_deadline"
            name="registration_deadline"
            defaultValue={event.registration_deadline ?? ''}
            className={cn(field, 'data')}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="organizer_name" className="label">
            Organizátor {hint('organizer_name')}
          </label>
          <input
            id="organizer_name"
            name="organizer_name"
            defaultValue={event.organizer_name ?? ''}
            className={box('organizer_name')}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="label">Témy (max. 5)</span>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(THEMES) as ThemeSlug[]).map((slug) => {
            const active = themes.includes(slug)
            return (
              <button
                key={slug}
                type="button"
                onClick={() =>
                  setThemes((current) =>
                    active
                      ? current.filter((entry) => entry !== slug)
                      : current.length < 5
                        ? [...current, slug]
                        : current
                  )
                }
                className={cn(chip, active && chipOn)}
              >
                {THEMES[slug]}
              </button>
            )
          })}
        </div>
        {themes.map((slug) => (
          <input key={slug} type="hidden" name="themes" value={slug} />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="eligibility" className="label">
            Pre koho
          </label>
          <select
            id="eligibility"
            name="eligibility"
            defaultValue={event.eligibility ?? ''}
            className={field}
          >
            <option value="">—</option>
            {Object.entries(ELIGIBILITY).map(([slug, text]) => (
              <option key={slug} value={slug}>
                {text}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="price_cents" className="label">
            Vstupné (centy)
          </label>
          <input
            id="price_cents"
            name="price_cents"
            type="number"
            min="0"
            defaultValue={event.price_cents ?? ''}
            className={field}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="currency" className="label">
            Mena
          </label>
          <select
            id="currency"
            name="currency"
            defaultValue={event.currency}
            className={field}
          >
            {['EUR', 'CZK', 'PLN', 'HUF'].map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="prizes" className="label">
            Ceny
          </label>
          <input
            id="prizes"
            name="prizes"
            defaultValue={event.prizes ?? ''}
            className={field}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="capacity" className="label">
            Kapacita
          </label>
          <input
            id="capacity"
            name="capacity"
            type="number"
            min="1"
            defaultValue={event.capacity ?? ''}
            className={field}
          />
        </div>
      </div>

      {(state.error || geocodeError) && (
        <p className="border-l-4 border-accent bg-ink p-3 text-sm text-ground">
          {state.error ?? geocodeError}
        </p>
      )}
      {state.ok && (
        <p className="border-l-4 border-line bg-surface p-3 text-sm text-muted">{state.ok}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start bg-accent px-5 py-3 text-sm font-bold uppercase tracking-[0.1em] text-accent-ink transition-transform hover:-translate-y-0.5 disabled:opacity-50"
      >
        {pending ? 'Ukladám…' : creating ? 'Vytvoriť podujatie' : 'Uložiť zmeny'}
      </button>
    </form>
  )
}
