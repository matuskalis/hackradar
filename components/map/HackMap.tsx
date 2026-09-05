'use client'

import { useCallback, useEffect, useRef } from 'react'
import maplibregl, { type MapLayerMouseEvent } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { HackathonCard } from '@/lib/db/types'
import { toSources } from './geojson'
import {
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
}

const STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ??
  'https://tiles.openfreemap.org/styles/liberty'

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
  useEffect(() => {
    handlers.current = { onSelect, onHover, onUserMove }
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
      style: STYLE_URL,
      center: [center.lng, center.lat],
      zoom,
      maxBounds: [
        [-13, 33],
        [45, 72],
      ],
    })
    map.current = instance

    instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    instance.addControl(new maplibregl.GeolocateControl({ trackUserLocation: false }), 'top-right')

    instance.on('load', () => {
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
      const { venues, cities } = toSources(items)
      ;(instance.getSource('venues') as maplibregl.GeoJSONSource).setData(venues)
      ;(instance.getSource('cities') as maplibregl.GeoJSONSource).setData(cities)
    })

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

  return <div ref={container} className="h-full w-full" />
}

export function MapSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-stone-100 text-sm text-stone-500">
      Načítavam mapu…
    </div>
  )
}
