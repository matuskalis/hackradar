'use client'

import { useEffect, useRef, useState } from 'react'
import type { CitySuggestion } from '@/app/api/geocode/route'

type Props = {
  onPick: (place: CitySuggestion) => void
}

export function CitySearch({ onPick }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CitySuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const container = useRef<HTMLDivElement>(null)

  const tooShort = query.trim().length < 2

  useEffect(() => {
    if (tooShort) return

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        })
        if (!response.ok) return
        const payload = (await response.json()) as { results: CitySuggestion[] }
        setResults(payload.results)
        setActive(0)
        setOpen(true)
      } catch {
        // Aborted or offline; the previous suggestions stay on screen.
      }
    }, 300)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [query, tooShort])

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const pick = (place: CitySuggestion) => {
    onPick(place)
    setQuery(place.name)
    setOpen(false)
  }

  return (
    <div ref={container} className="relative">
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onKeyDown={(event) => {
          if (!open || results.length === 0) return
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setActive((index) => (index + 1) % results.length)
          } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            setActive((index) => (index - 1 + results.length) % results.length)
          } else if (event.key === 'Enter') {
            event.preventDefault()
            pick(results[active])
          } else if (event.key === 'Escape') {
            setOpen(false)
          }
        }}
        placeholder="Zadajte mesto"
        aria-label="Vyhľadať mesto"
        className="w-full border border-line bg-ground px-3 py-2 text-sm text-ink placeholder:text-muted"
      />

      {open && !tooShort && results.length > 0 && (
        <ul className="absolute z-20 w-full border border-ink bg-ground shadow-[4px_4px_0_var(--color-ink)]">
          {results.map((place, index) => (
            <li key={`${place.name}-${place.lat}-${place.lng}`}>
              <button
                type="button"
                onMouseEnter={() => setActive(index)}
                onClick={() => pick(place)}
                className={`flex w-full flex-col items-start border-b border-line px-3 py-2 text-left text-sm last:border-b-0 ${
                  index === active ? 'bg-accent text-accent-ink' : 'bg-ground'
                }`}
              >
                <span className="font-semibold">{place.name}</span>
                <span className="data text-[11px] uppercase tracking-[0.06em] opacity-70">
                  {[place.region, place.country].filter(Boolean).join(', ')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
