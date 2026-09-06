'use client'

import { useState } from 'react'
import { ELIGIBILITY, FORMATS, THEMES } from '@/lib/taxonomy'
import type { ThemeSlug } from '@/lib/taxonomy'
import { cn } from '@/lib/utils'

const COUNTRIES = {
  SK: 'Slovensko',
  CZ: 'Česko',
  AT: 'Rakúsko',
  HU: 'Maďarsko',
  PL: 'Poľsko',
  DE: 'Nemecko',
} as const

const field = 'w-full border border-line bg-ground px-3 py-2 text-sm text-ink'
const label = 'label'
const chip =
  'border border-line px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted transition-colors hover:border-ink hover:text-ink'
const chipOn = 'border-ink bg-ink text-ground hover:bg-ink hover:text-ground'

/** Local datetime from the form, plus the browser offset the visitor typed in. */
function toIso(value: string): string {
  const date = new Date(value)
  const offsetMinutes = -date.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0')
  return `${value}:00${sign}${pad(offsetMinutes / 60)}:${pad(offsetMinutes % 60)}`
}

export function SubmitForm() {
  const [themes, setThemes] = useState<string[]>([])
  const [format, setFormat] = useState<'onsite' | 'online' | 'hybrid'>('onsite')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [errors, setErrors] = useState<string[]>([])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState('sending')
    setErrors([])

    const form = new FormData(event.currentTarget)
    const text = (key: string) => {
      const value = form.get(key)
      return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined
    }

    const price = text('price')
    const payload = {
      name: text('name'),
      description: text('description'),
      start_at: toIso(String(form.get('start_at'))),
      end_at: toIso(String(form.get('end_at'))),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      format,
      venue_name: text('venue_name'),
      address: text('address'),
      city: text('city'),
      country_code: text('country_code'),
      url: text('url'),
      registration_url: text('registration_url'),
      themes,
      eligibility: text('eligibility'),
      price_cents: price != null ? Math.round(Number(price) * 100) : undefined,
      organizer_name: text('organizer_name'),
      website: text('website') ?? '',
    }

    const response = await fetch('/api/hackathons/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (response.ok) {
      setState('sent')
      return
    }

    const problem = (await response.json()) as {
      error?: string
      issues?: { fieldErrors?: Record<string, string[]> }
    }
    const fields = Object.entries(problem.issues?.fieldErrors ?? {}).map(
      ([key, messages]) => `${key}: ${messages.join(', ')}`
    )
    setErrors(fields.length > 0 ? fields : [problem.error ?? 'Odoslanie zlyhalo.'])
    setState('idle')
  }

  if (state === 'sent') {
    return (
      <div className="border-l-4 border-accent bg-ink p-6 text-ground">
        <h2 className="text-2xl font-bold tracking-tight">Ďakujeme.</h2>
        <p className="mt-2 max-w-[46ch] text-sm opacity-80">
          Hackathon sme prijali. Pozrieme ho a po schválení sa objaví na mape.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className={label}>
          Názov *
        </label>
        <input id="name" name="name" required minLength={3} className={field} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className={label}>
          Popis
        </label>
        <textarea id="description" name="description" rows={4} className={field} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="start_at" className={label}>
            Začiatok *
          </label>
          <input id="start_at" name="start_at" type="datetime-local" required className={field} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="end_at" className={label}>
            Koniec *
          </label>
          <input id="end_at" name="end_at" type="datetime-local" required className={field} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className={label}>Formát *</span>
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
      </div>

      {format !== 'online' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="venue_name" className={label}>
              Miesto konania
            </label>
            <input id="venue_name" name="venue_name" className={field} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="address" className={label}>
              Adresa
            </label>
            <input id="address" name="address" className={field} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="city" className={label}>
              Mesto *
            </label>
            <input id="city" name="city" required className={field} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="country_code" className={label}>
              Krajina *
            </label>
            <select
              id="country_code"
              name="country_code"
              required
              defaultValue="SK"
              className={field}
            >
              {Object.entries(COUNTRIES).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="url" className={label}>
            Web hackathonu *
          </label>
          <input id="url" name="url" type="url" required placeholder="https://" className={field} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="registration_url" className={label}>
            Odkaz na registráciu
          </label>
          <input
            id="registration_url"
            name="registration_url"
            type="url"
            placeholder="https://"
            className={field}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className={label}>Témy (max. 5)</span>
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
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="eligibility" className={label}>
            Pre koho
          </label>
          <select id="eligibility" name="eligibility" defaultValue="open" className={field}>
            {Object.entries(ELIGIBILITY).map(([slug, text]) => (
              <option key={slug} value={slug}>
                {text}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="price" className={label}>
            Vstupné (EUR)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            defaultValue="0"
            className={field}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="organizer_name" className={label}>
            Organizátor *
          </label>
          <input id="organizer_name" name="organizer_name" required className={field} />
        </div>
      </div>

      <div aria-hidden className="hidden">
        <label htmlFor="website">Nevypĺňajte</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {errors.length > 0 && (
        <ul className="border-l-4 border-accent bg-ink p-3 text-sm text-ground">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      <button
        type="submit"
        disabled={state === 'sending'}
        className="self-start bg-accent px-5 py-3 text-sm font-bold uppercase tracking-[0.1em] text-accent-ink transition-transform hover:-translate-y-0.5 disabled:opacity-50"
      >
        {state === 'sending' ? 'Odosielam…' : 'Odoslať na schválenie'}
      </button>
    </form>
  )
}
