'use client'

import { useState } from 'react'
import { ELIGIBILITY, FORMATS, RADIUS_OPTIONS, THEMES } from '@/lib/taxonomy'
import type { ThemeSlug } from '@/lib/taxonomy'
import { cn } from '@/lib/utils'

export type FilterState = {
  radius: number
  formats: string[]
  themes: string[]
  free: boolean
  eligibility: string | null
  from: string | null
  to: string | null
}

export const EMPTY_FILTERS: FilterState = {
  radius: 50,
  formats: [],
  themes: [],
  free: false,
  eligibility: null,
  from: null,
  to: null,
}

type Props = {
  value: FilterState
  onChange: (next: FilterState) => void
  radiusDisabled: boolean
}

function toggle(list: string[], item: string): string[] {
  return list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item]
}

const FORMAT_CLASS: Record<string, string> = {
  onsite: 'bg-onsite',
  online: 'bg-online',
  hybrid: 'bg-hybrid',
}

const chip =
  'border border-line px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted transition-colors hover:border-ink hover:text-ink'
const chipOn = 'border-ink bg-ink text-ground hover:bg-ink hover:text-ground'

export function Filters({ value, onChange, radiusDisabled }: Props) {
  const [themesOpen, setThemesOpen] = useState(false)
  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch })

  const themeSlugs = Object.keys(THEMES) as ThemeSlug[]
  const visibleThemes = themesOpen
    ? themeSlugs
    : themeSlugs.filter((slug) => value.themes.includes(slug))

  return (
    <div className="flex flex-col gap-4 border-b border-line p-4">
      <div className="flex flex-col gap-1.5">
        <span className="label">Vzdialenosť</span>
        <div
          className={cn(
            'grid grid-cols-5 border border-line',
            radiusDisabled && 'opacity-40'
          )}
        >
          {RADIUS_OPTIONS.map((option, index) => (
            <button
              key={option}
              type="button"
              disabled={radiusDisabled}
              onClick={() => set({ radius: option })}
              className={cn(
                'data py-1.5 text-xs font-medium transition-colors',
                index > 0 && 'border-l border-line',
                value.radius === option && !radiusDisabled
                  ? 'bg-accent text-accent-ink'
                  : 'text-muted hover:text-ink',
                radiusDisabled && 'cursor-not-allowed'
              )}
            >
              {option}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted">
          {radiusDisabled
            ? 'Hľadáte vo výreze mapy. Vráťte sa na svoju polohu, ak chcete filtrovať podľa vzdialenosti.'
            : 'kilometrov od stredu'}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="label">Formát</span>
        <div className="grid grid-cols-3 gap-px bg-line">
          {Object.entries(FORMATS).map(([slug, text]) => {
            const active = value.formats.includes(slug)
            return (
              <button
                key={slug}
                type="button"
                onClick={() => set({ formats: toggle(value.formats, slug) })}
                className={cn(
                  'py-1.5 text-xs font-bold uppercase tracking-[0.08em] transition-colors',
                  active
                    ? `${FORMAT_CLASS[slug]} text-accent-ink`
                    : 'bg-ground text-muted hover:text-ink'
                )}
              >
                {text}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => setThemesOpen((open) => !open)}
          aria-expanded={themesOpen}
          className="flex items-center justify-between text-left"
        >
          <span className="label">
            Téma
            {value.themes.length > 0 && (
              <span className="ml-1.5 text-accent">({value.themes.length})</span>
            )}
          </span>
          <span className="label">{themesOpen ? '–' : '+'}</span>
        </button>

        {visibleThemes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {visibleThemes.map((slug) => (
              <button
                key={slug}
                type="button"
                onClick={() => set({ themes: toggle(value.themes, slug) })}
                className={cn(chip, value.themes.includes(slug) && chipOn)}
              >
                {THEMES[slug]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <select
          aria-label="Pre koho"
          value={value.eligibility ?? ''}
          onChange={(event) => set({ eligibility: event.target.value || null })}
          className="border border-line bg-ground px-2 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink"
        >
          <option value="">Pre koho: všetci</option>
          {Object.entries(ELIGIBILITY).map(([slug, text]) => (
            <option key={slug} value={slug}>
              {text}
            </option>
          ))}
        </select>

        <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink">
          <input
            type="checkbox"
            checked={value.free}
            onChange={(event) => set({ free: event.target.checked })}
            className="size-3.5 accent-accent"
          />
          Iba zadarmo
        </label>

        <button
          type="button"
          onClick={() => onChange({ ...EMPTY_FILTERS, radius: value.radius })}
          className="ml-auto text-xs font-semibold uppercase tracking-[0.08em] text-muted underline underline-offset-4 hover:text-accent"
        >
          Zrušiť
        </button>
      </div>
    </div>
  )
}
