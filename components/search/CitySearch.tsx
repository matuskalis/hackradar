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
        className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-orange-600"
      />

      {open && !tooShort && results.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-stone-200 bg-white shadow-lg">
          {results.map((place, index) => (
            <li key={`${place.name}-${place.lat}-${place.lng}`}>
              <button
                type="button"
                onMouseEnter={() => setActive(index)}
                onClick={() => pick(place)}
                className={`flex w-full flex-col items-start px-3 py-2 text-left text-sm ${
                  index === active ? 'bg-orange-50' : 'bg-white'
                }`}
              >
                <span className="font-medium text-stone-900">{place.name}</span>
                <span className="text-xs text-stone-500">
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
