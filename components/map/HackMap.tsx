'use client'

import { useCallback, useEffect, useRef } from 'react'
import maplibregl, { type MapLayerMouseEvent } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { HackathonCard } from '@/lib/db/types'
import { toSources } from './geojson'
import {
  calmBasemap,
  cityAreaLayer,
  cityDotLayer,
  clusterCountLayer,
  clusterLayer,
  venuePinLayer,
} from './mapStyle'

export type Bbox = [number, number, number, number]

type Props = {
  items: HackathonCard[]
  center: { lat: number; lng: number }
  zoom: number
  selectedId: string | null
  hoveredId: string | null
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
  onUserMove: (bbox: Bbox) => void
  /** Detail pages show one venue: no controls, no panning, no interaction. */
  readOnly?: boolean
}

const LIGHT_STYLE =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ??
  'https://tiles.openfreemap.org/styles/liberty'
const DARK_STYLE =
  process.env.NEXT_PUBLIC_MAP_STYLE_DARK_URL ??
  'https://tiles.openfreemap.org/styles/dark'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function prefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(DARK_QUERY).matches
}

const MOVE_DEBOUNCE_MS = 400
const PIN_LAYERS = ['venue-pins', 'city-areas']

export default function HackMap({
  items,
  center,
  zoom,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  onUserMove,
  readOnly = false,
}: Props) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const ready = useRef(false)
  const moveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const featureState = useRef<{ hovered: string | null; selected: string | null }>({
    hovered: null,
    selected: null,
  })

  // Callbacks change every render in the parent; keep them out of the effect deps.
  const handlers = useRef({ onSelect, onHover, onUserMove })
  const itemsRef = useRef(items)
  useEffect(() => {
    handlers.current = { onSelect, onHover, onUserMove }
    itemsRef.current = items
  })

  const setState = useCallback(
    (key: 'hovered' | 'selected', id: string | null) => {
      const instance = map.current
      if (!instance || !ready.current) return

      const previous = featureState.current[key]
      for (const source of ['venues', 'cities'] as const) {
        if (previous) {
          instance.removeFeatureState({ source, id: previous }, key)
        }
        if (id) {
          instance.setFeatureState({ source, id }, { [key]: true })
        }
      }
      featureState.current[key] = id
    },
    []
  )

  useEffect(() => {
    if (!container.current || map.current) return

    const instance = new maplibregl.Map({
      container: container.current,
      style: prefersDark() ? DARK_STYLE : LIGHT_STYLE,
      center: [center.lng, center.lat],
      zoom,
      maxBounds: [
        [-13, 33],
        [45, 72],
      ],
      interactive: !readOnly,
      // MapLibre's attribution control renders HTML from the style JSON through
      // DOM.sanitize(), which has an unpatched bypass in every 5.x release
      // (GHSA-jrc7-96c5-q579). The fix is 6.9, and 6.x does not load under
      // Turbopack at all. Turning the control off removes the only path from
      // third-party HTML into that sanitizer; the attribution OpenFreeMap
      // requires is rendered below as React text instead.
      attributionControl: false,
    })
    map.current = instance

    if (!readOnly) {
      instance.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        'top-right'
      )
      instance.addControl(
        new maplibregl.GeolocateControl({ trackUserLocation: false }),
        'top-right'
      )
    }

    // Switching the base style drops every custom source and layer, so the
    // same setup runs on first load and again after each style swap.
    const addOwnLayers = () => {
      calmBasemap(instance, prefersDark())

      const empty: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }

      instance.addSource('venues', {
        type: 'geojson',
        data: empty,
        cluster: true,
        clusterRadius: 50,
        clusterMaxZoom: 12,
        promoteId: 'id',
      })
      instance.addSource('cities', { type: 'geojson', data: empty, promoteId: 'id' })

      instance.addLayer(cityAreaLayer)
      instance.addLayer(cityDotLayer)
      instance.addLayer(clusterLayer)
      instance.addLayer(clusterCountLayer)
      instance.addLayer(venuePinLayer)

      ready.current = true
      const { venues, cities } = toSources(itemsRef.current)
      ;(instance.getSource('venues') as maplibregl.GeoJSONSource).setData(venues)
      ;(instance.getSource('cities') as maplibregl.GeoJSONSource).setData(cities)
    }

    instance.on('load', addOwnLayers)

    const media = window.matchMedia(DARK_QUERY)
    const onThemeChange = (event: MediaQueryListEvent) => {
      ready.current = false
      instance.setStyle(event.matches ? DARK_STYLE : LIGHT_STYLE)
      instance.once('styledata', addOwnLayers)
    }
    media.addEventListener('change', onThemeChange)

    instance.on('click', 'clusters', async (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0]
      const clusterId = feature?.properties?.cluster_id
      if (clusterId == null) return

      const source = instance.getSource('venues') as maplibregl.GeoJSONSource
      const nextZoom = await source.getClusterExpansionZoom(clusterId)
      instance.easeTo({
        center: (feature!.geometry as GeoJSON.Point).coordinates as [number, number],
        zoom: nextZoom,
      })
    })

    for (const layer of PIN_LAYERS) {
      instance.on('click', layer, (event: MapLayerMouseEvent) => {
        const id = event.features?.[0]?.properties?.id
        if (typeof id === 'string') handlers.current.onSelect(id)
      })
      instance.on('mousemove', layer, (event: MapLayerMouseEvent) => {
        const id = event.features?.[0]?.properties?.id
        instance.getCanvas().style.cursor = 'pointer'
        if (typeof id === 'string') handlers.current.onHover(id)
      })
      instance.on('mouseleave', layer, () => {
        instance.getCanvas().style.cursor = ''
        handlers.current.onHover(null)
      })
    }

    instance.on('mouseenter', 'clusters', () => {
      instance.getCanvas().style.cursor = 'pointer'
    })
    instance.on('mouseleave', 'clusters', () => {
      instance.getCanvas().style.cursor = ''
    })

    instance.on('moveend', (event) => {
      // Only a drag, zoom or wheel by the visitor switches the search to the
      // viewport; our own flyTo and easeTo calls must not.
      if (!event.originalEvent) return
      if (moveTimer.current) clearTimeout(moveTimer.current)
      moveTimer.current = setTimeout(() => {
        const bounds = instance.getBounds()
        handlers.current.onUserMove([
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth(),
        ])
      }, MOVE_DEBOUNCE_MS)
    })

    const observer = new ResizeObserver(() => instance.resize())
    observer.observe(container.current)

    return () => {
      media.removeEventListener('change', onThemeChange)
      observer.disconnect()
      if (moveTimer.current) clearTimeout(moveTimer.current)
      instance.remove()
      map.current = null
      ready.current = false
    }
    // Mount once: later prop changes are handled by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const instance = map.current
    if (!instance || !ready.current) return

    const { venues, cities } = toSources(items)
    ;(instance.getSource('venues') as maplibregl.GeoJSONSource)?.setData(venues)
    ;(instance.getSource('cities') as maplibregl.GeoJSONSource)?.setData(cities)
  }, [items])

  useEffect(() => {
    setState('hovered', hoveredId)
  }, [hoveredId, setState])

  useEffect(() => {
    setState('selected', selectedId)

    const instance = map.current
    if (!instance || !selectedId) return

    const item = items.find((entry) => entry.id === selectedId)
    if (item?.lat == null || item.lng == null) return

    // Only recentre when the selection is off screen, so clicking a card does
    // not yank the map the visitor just positioned.
    if (!instance.getBounds().contains([item.lng, item.lat])) {
      instance.flyTo({ center: [item.lng, item.lat], zoom: Math.max(instance.getZoom(), 9) })
    }
  }, [selectedId, items, setState])

  useEffect(() => {
    const instance = map.current
    if (!instance) return
    instance.flyTo({ center: [center.lng, center.lat], zoom })
  }, [center.lat, center.lng, zoom])

  return (
    <div className="relative h-full w-full">
      <div ref={container} className="h-full w-full" />
      <MapAttribution />
    </div>
  )
}

/**
 * OpenFreeMap requires attribution. Rendering it here as text keeps MapLibre's
 * HTML sanitizer out of the picture entirely.
 */
function MapAttribution() {
  return (
    <p className="pointer-events-auto absolute bottom-0 right-0 z-10 bg-ground/85 px-1.5 py-0.5 text-[10px] text-muted">
      <a
        href="https://openfreemap.org/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2"
      >
        OpenFreeMap
      </a>
      {' © OpenMapTiles Data from '}
      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2"
      >
        OpenStreetMap
      </a>
    </p>
  )
}

export function MapSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-ink/[0.04]">
      <span className="data animate-pulse text-[11px] uppercase tracking-[0.14em] text-muted">
        Načítavam mapu
      </span>
    </div>
  )
}
