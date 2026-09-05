'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Bbox } from '@/components/map/HackMap'
import { MapSkeleton } from '@/components/map/HackMap'
import { CitySearch } from '@/components/search/CitySearch'
import type { HackathonCard } from '@/lib/db/types'
import { useGeolocation } from '@/lib/hooks/useGeolocation'
import { cn } from '@/lib/utils'
import { EMPTY_FILTERS, Filters, type FilterState } from './Filters'
import { HackathonList } from './HackathonList'

const HackMap = dynamic(() => import('@/components/map/HackMap'), {
  ssr: false,
  loading: () => <MapSkeleton />,
})

type Props = {
  initialCenter: { lat: number; lng: number }
  initialLabel: string
  initialItems?: HackathonCard[]
}

type Search =
  | { mode: 'radius'; lat: number; lng: number }
  | { mode: 'bbox'; bbox: Bbox }

function buildQuery(search: Search, filters: FilterState): string {
  const params = new URLSearchParams()

  if (search.mode === 'radius') {
    params.set('lat', search.lat.toFixed(5))
    params.set('lng', search.lng.toFixed(5))
    params.set('radius', String(filters.radius))
  } else {
    params.set('bbox', search.bbox.map((value) => value.toFixed(4)).join(','))
  }

  if (filters.formats.length > 0) params.set('format', filters.formats.join(','))
  if (filters.themes.length > 0) params.set('themes', filters.themes.join(','))
  if (filters.free) params.set('free', 'true')
  if (filters.eligibility) params.set('eligibility', filters.eligibility)
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)

  return params.toString()
}

export function MapExplorer({ initialCenter, initialLabel, initialItems = [] }: Props) {
  const [center, setCenter] = useState(initialCenter)
  const [zoom, setZoom] = useState(9)
  const [label, setLabel] = useState(initialLabel)
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)
  const [search, setSearch] = useState<Search>({ mode: 'radius', ...initialCenter })
  const [items, setItems] = useState<HackathonCard[]>(initialItems)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [mobileTab, setMobileTab] = useState<'map' | 'list'>('map')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const geo = useGeolocation((coords) => {
    setCenter(coords)
    setSearch({ mode: 'radius', ...coords })
    setLabel('vašej polohy')
  })
  const skipFirstFetch = useRef(initialItems.length > 0)

  useEffect(() => {
    if (skipFirstFetch.current) {
      skipFirstFetch.current = false
      return
    }

    const controller = new AbortController()
    setLoading(true)

    fetch(`/api/hackathons?${buildQuery(search, filters)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(String(response.status))
        return response.json() as Promise<{ items: HackathonCard[] }>
      })
      .then((payload) => {
        setItems(payload.items)
        setError(null)
      })
      .catch((cause: unknown) => {
        if (cause instanceof Error && cause.name === 'AbortError') return
        setError('Hackathony sa nepodarilo načítať. Skúste to znova.')
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [search, filters])

  const handleUserMove = useCallback((bbox: Bbox) => {
    setSearch({ mode: 'bbox', bbox })
  }, [])

  const backToCenter = () => {
    const target = geo.coords ?? initialCenter
    setCenter(target)
    setZoom(9)
    setSearch({ mode: 'radius', ...target })
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col md:flex-row">
      <section
        className={cn(
          'flex min-h-0 flex-col border-stone-200 md:max-w-md md:flex-1 md:border-r',
          mobileTab === 'list' ? 'flex-1' : 'flex-none'
        )}
      >
        <div className="flex flex-col gap-3 border-b border-stone-200 p-4">
          <CitySearch
            onPick={(place) => {
              setCenter({ lat: place.lat, lng: place.lng })
              setZoom(10)
              setSearch({ mode: 'radius', lat: place.lat, lng: place.lng })
              setLabel(place.name)
            }}
          />

          <div className="flex flex-wrap items-center gap-3 text-sm">
            {geo.status !== 'granted' && (
              <button
                type="button"
                onClick={geo.request}
                disabled={geo.status === 'loading' || geo.status === 'unsupported'}
                className="rounded-md bg-stone-900 px-3 py-1.5 text-white disabled:opacity-50"
              >
                {geo.status === 'loading' ? 'Zisťujem polohu…' : 'Použiť moju polohu'}
              </button>
            )}
            {geo.status === 'denied' && (
              <span className="text-stone-500">
                Poloha zamietnutá, zobrazujem {initialLabel}.
              </span>
            )}
            {search.mode === 'bbox' && (
              <button
                type="button"
                onClick={backToCenter}
                className="rounded-full border border-stone-300 px-3 py-1 text-stone-700"
              >
                Späť na {label}
              </button>
            )}
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              className="rounded-full border border-stone-300 px-3 py-1 text-stone-700 md:hidden"
            >
              {filtersOpen ? 'Skryť filtre' : 'Filtre'}
            </button>
          </div>
        </div>

        <div
          className={cn(
            'md:block',
            filtersOpen ? 'max-h-[50dvh] overflow-y-auto' : 'hidden'
          )}
        >
          <Filters
            value={filters}
            onChange={setFilters}
            radiusDisabled={search.mode === 'bbox'}
          />
        </div>

        <div
          className={cn(
            'items-center justify-between px-4 py-2 text-sm text-stone-600 md:flex',
            mobileTab === 'list' ? 'flex' : 'hidden'
          )}
        >
          <span>
            {loading ? 'Načítavam…' : `${items.length} hackathonov`}
            {search.mode === 'radius' && !loading && ` v okolí ${label}`}
          </span>
          <Link href="/pridat" className="text-orange-700 underline underline-offset-2">
            Pridať hackathon
          </Link>
        </div>

        {error && (
          <p className="border-y border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
            {error}
          </p>
        )}

        <div
          className={cn(
            'min-h-0 flex-1 overflow-y-auto',
            mobileTab === 'map' && 'hidden md:block'
          )}
        >
          <HackathonList
            items={items}
            loading={loading}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onSelect={setSelectedId}
            onHover={setHoveredId}
          />
        </div>
      </section>

      <section
        className={cn('min-h-0 flex-1', mobileTab === 'list' && 'hidden md:block')}
      >
        <HackMap
          items={items}
          center={center}
          zoom={zoom}
          selectedId={selectedId}
          hoveredId={hoveredId}
          onSelect={(id) => {
            setSelectedId(id)
            setMobileTab('list')
          }}
          onHover={setHoveredId}
          onUserMove={handleUserMove}
        />
      </section>

      <div className="flex border-t border-stone-200 bg-white md:hidden">
        {(['map', 'list'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMobileTab(tab)}
            className={cn(
              'flex-1 py-3 text-sm font-medium',
              mobileTab === tab ? 'bg-stone-900 text-white' : 'text-stone-600'
            )}
          >
            {tab === 'map' ? 'Mapa' : `Zoznam (${items.length})`}
          </button>
        ))}
      </div>
    </div>
  )
}
