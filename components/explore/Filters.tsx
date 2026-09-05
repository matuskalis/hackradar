'use client'

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

const chipBase =
  'rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600'
const chipOn = 'border-orange-600 bg-orange-600 text-white'
const chipOff = 'border-stone-300 bg-white text-stone-700 hover:border-stone-400'

export function Filters({ value, onChange, radiusDisabled }: Props) {
  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch })

  return (
    <div className="flex flex-col gap-4 border-b border-stone-200 p-4">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Vzdialenosť
        </label>
        <div className="flex flex-wrap gap-2">
          {RADIUS_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              disabled={radiusDisabled}
              onClick={() => set({ radius: option })}
              className={cn(
                chipBase,
                value.radius === option && !radiusDisabled ? chipOn : chipOff,
                radiusDisabled && 'cursor-not-allowed opacity-40'
              )}
            >
              {option} km
            </button>
          ))}
        </div>
        {radiusDisabled && (
          <p className="text-xs text-stone-500">
            Hľadáte vo výreze mapy. Vráťte sa na svoju polohu, ak chcete filtrovať podľa
            vzdialenosti.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Formát
        </label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(FORMATS).map(([slug, label]) => (
            <button
              key={slug}
              type="button"
              onClick={() => set({ formats: toggle(value.formats, slug) })}
              className={cn(chipBase, value.formats.includes(slug) ? chipOn : chipOff)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Téma
        </label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(THEMES) as ThemeSlug[]).map((slug) => (
            <button
              key={slug}
              type="button"
              onClick={() => set({ themes: toggle(value.themes, slug) })}
              className={cn(chipBase, value.themes.includes(slug) ? chipOn : chipOff)}
            >
              {THEMES[slug]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="filter-eligibility"
            className="text-xs font-semibold uppercase tracking-wide text-stone-500"
          >
            Pre koho
          </label>
          <select
            id="filter-eligibility"
            value={value.eligibility ?? ''}
            onChange={(event) => set({ eligibility: event.target.value || null })}
            className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-800"
          >
            <option value="">Nezáleží</option>
            {Object.entries(ELIGIBILITY).map(([slug, label]) => (
              <option key={slug} value={slug}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 pb-1.5 text-sm text-stone-700">
          <input
            type="checkbox"
            checked={value.free}
            onChange={(event) => set({ free: event.target.checked })}
            className="size-4 accent-orange-600"
          />
          Iba zadarmo
        </label>

        <button
          type="button"
          onClick={() => onChange({ ...EMPTY_FILTERS, radius: value.radius })}
          className="pb-1.5 text-sm text-stone-500 underline underline-offset-2 hover:text-stone-800"
        >
          Zrušiť filtre
        </button>
      </div>
    </div>
  )
}
