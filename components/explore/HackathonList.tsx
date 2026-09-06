'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
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

const FORMAT_BAR: Record<string, string> = {
  onsite: 'bg-onsite',
  online: 'bg-online',
  hybrid: 'bg-hybrid',
}

const dateFormat = new Intl.DateTimeFormat('sk-SK', {
  day: '2-digit',
  month: '2-digit',
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
  return `registrácia ${days} dní`
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
      <div className="p-6">
        <p className="text-2xl font-bold tracking-tight">Tu zatiaľ nič nie je.</p>
        <p className="mt-2 max-w-[38ch] text-sm text-muted">
          Skúste väčší okruh alebo zrušte filtre. Ak o nejakom hackathone viete,{' '}
          <Link href="/pridat" className="text-accent underline underline-offset-4">
            pridajte ho
          </Link>
          .
        </p>
      </div>
    )
  }

  // Online events have no place, so they are not "nearby" and would otherwise
  // pad out the local list on a city page.
  const nearby = items.filter((item) => item.lat != null)
  const online = items.filter((item) => item.lat == null)

  const renderItem = (item: HackathonCard) => {
    const deadline = daysLeft(item.registration_deadline)
    const isSelected = item.id === selectedId
    const isHovered = item.id === hoveredId

    return (
      <li
        key={item.id}
        ref={isSelected ? selectedRef : null}
        onMouseEnter={() => onHover(item.id)}
        onMouseLeave={() => onHover(null)}
        className={cn('flex transition-colors', isSelected && 'bg-ink/[0.04]')}
      >
        <span
          aria-hidden
          className={cn(
            'shrink-0 transition-all',
            FORMAT_BAR[item.format],
            isSelected ? 'w-2' : isHovered ? 'w-1.5' : 'w-1'
          )}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-1.5 px-4 py-3.5">
          <button
            type="button"
            onClick={() => onSelect(item.id)}
            className="text-left text-[15px] font-bold leading-snug tracking-tight text-balance"
          >
            {item.name}
          </button>

          <p className="data text-[11px] uppercase tracking-[0.06em] text-muted">
            {dateRange(item.start_at, item.end_at)}
            {' · '}
            {item.lat != null && item.city ? item.city : FORMATS[item.format]}
            {item.distance_km != null && ` · ${formatDistance(item.distance_km)}`}
          </p>

          {item.themes.length > 0 && (
            <p className="truncate text-[11px] text-muted">
              {item.themes.map((theme) => THEMES[theme as ThemeSlug] ?? theme).join(' · ')}
            </p>
          )}

          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link
              href={`/hackathon/${item.slug}`}
              className="text-[11px] font-bold uppercase tracking-[0.1em] text-accent underline underline-offset-4"
            >
              Detail
            </Link>
            {deadline && (
              <span className="data text-[11px] uppercase tracking-[0.06em] text-muted">
                {deadline}
              </span>
            )}
            {item.price_cents === 0 && (
              <span className="border border-line px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
                zadarmo
              </span>
            )}
          </div>
        </div>
      </li>
    )
  }

  return (
    <>
      {nearby.length > 0 && (
        <ul className="divide-y divide-line">{nearby.map(renderItem)}</ul>
      )}

      {online.length > 0 && (
        <>
          <h2 className="flex items-baseline justify-between bg-ink px-4 py-2 text-ground">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em]">
              Online, odkiaľkoľvek
            </span>
            <span className="data text-[11px]">{online.length}</span>
          </h2>
          <ul className="divide-y divide-line">{online.map(renderItem)}</ul>
        </>
      )}
    </>
  )
}
