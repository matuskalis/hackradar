'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { FORMAT_COLORS } from '@/components/map/mapStyle'
import type { HackathonCard } from '@/lib/db/types'
import { FORMATS, THEMES } from '@/lib/taxonomy'
import type { ThemeSlug } from '@/lib/taxonomy'
import { cn, formatDistance } from '@/lib/utils'

type Props = {
  items: HackathonCard[]
  loading: boolean
  selectedId: string | null
  hoveredId: string | null
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}

const dateFormat = new Intl.DateTimeFormat('sk-SK', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function dateRange(start: string, end: string): string {
  const from = new Date(start)
  const to = new Date(end)
  if (from.toDateString() === to.toDateString()) return dateFormat.format(from)
  return `${dateFormat.format(from)} – ${dateFormat.format(to)}`
}

function daysLeft(deadline: string | null): string | null {
  if (!deadline) return null
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000)
  if (days < 0) return 'registrácia uzavretá'
  if (days === 0) return 'registrácia končí dnes'
  if (days === 1) return 'registrácia končí zajtra'
  return `do konca registrácie ${days} dní`
}

export function HackathonList({
  items,
  loading,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
}: Props) {
  const selectedRef = useRef<HTMLLIElement>(null)

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest' })
  }, [selectedId])

  if (!loading && items.length === 0) {
    return (
      <div className="p-6 text-sm text-stone-600">
        <p className="font-medium text-stone-800">Tu zatiaľ nič nie je.</p>
        <p className="mt-1">
          Skúste väčší okruh alebo zrušte filtre. Ak o nejakom hackathone viete,{' '}
          <Link href="/pridat" className="text-orange-700 underline underline-offset-2">
            pridajte ho
          </Link>
          .
        </p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-stone-200">
      {items.map((item) => {
        const deadline = daysLeft(item.registration_deadline)
        const isSelected = item.id === selectedId

        return (
          <li
            key={item.id}
            ref={isSelected ? selectedRef : null}
            onMouseEnter={() => onHover(item.id)}
            onMouseLeave={() => onHover(null)}
            className={cn(
              'transition-colors',
              isSelected && 'bg-orange-50',
              !isSelected && item.id === hoveredId && 'bg-stone-50'
            )}
          >
            <div className="flex flex-col gap-2 p-4">
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className="text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
              >
                <span className="flex items-start gap-2">
                  <span
                    aria-hidden
                    className="mt-1.5 size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: FORMAT_COLORS[item.format] }}
                  />
                  <span className="font-semibold text-stone-900">{item.name}</span>
                </span>
              </button>

              <p className="text-sm text-stone-600">
                {dateRange(item.start_at, item.end_at)}
                {' · '}
                {item.city ?? FORMATS[item.format]}
                {item.distance_km != null && ` · ${formatDistance(item.distance_km)}`}
              </p>

              {item.themes.length > 0 && (
                <p className="text-xs text-stone-500">
                  {item.themes
                    .map((theme) => THEMES[theme as ThemeSlug] ?? theme)
                    .join(' · ')}
                </p>
              )}

              <div className="flex items-center gap-3">
                <Link
                  href={`/hackathon/${item.slug}`}
                  className="text-sm font-medium text-orange-700 underline underline-offset-2"
                >
                  Detail
                </Link>
                {deadline && <span className="text-xs text-stone-500">{deadline}</span>}
                {item.price_cents === 0 && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800">
                    zadarmo
                  </span>
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
