'use client'

import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef } from 'react'
import { FORMAT_COLORS } from '@/components/map/mapStyle'

const STYLE =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? 'https://tiles.openfreemap.org/styles/liberty'

type Props = {
  lat: number
  lng: number
  onMove: (lat: number, lng: number) => void
}

/**
 * One draggable pin. Clicking the map moves it too, which is faster than
 * dragging across a city. No popup anywhere: MapLibre 5 renders popup HTML
 * through a sanitizer with a known bypass, see SECURITY.md.
 */
export default function MarkerMap({ lat, lng, onMove }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const marker = useRef<maplibregl.Marker | null>(null)
  const onMoveRef = useRef(onMove)

  useEffect(() => {
    onMoveRef.current = onMove
  })

  useEffect(() => {
    if (!container.current || map.current) return

    const instance = new maplibregl.Map({
      container: container.current,
      style: STYLE,
      center: [lng, lat],
      zoom: 13,
      attributionControl: false,
    })
    map.current = instance
    instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

    const pin = new maplibregl.Marker({ draggable: true, color: FORMAT_COLORS.onsite })
      .setLngLat([lng, lat])
      .addTo(instance)
    marker.current = pin

    pin.on('dragend', () => {
      const point = pin.getLngLat()
      onMoveRef.current(point.lat, point.lng)
    })
    instance.on('click', (event) => {
      pin.setLngLat(event.lngLat)
      onMoveRef.current(event.lngLat.lat, event.lngLat.lng)
    })

    const observer = new ResizeObserver(() => instance.resize())
    observer.observe(container.current)

    return () => {
      observer.disconnect()
      instance.remove()
      map.current = null
      marker.current = null
    }
    // Mount once; later coordinate changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const instance = map.current
    if (!instance) return

    marker.current?.setLngLat([lng, lat])
    // Only recentre when the pin left the viewport, so a drag does not fight
    // the map the admin just positioned.
    if (!instance.getBounds().contains([lng, lat])) {
      instance.flyTo({ center: [lng, lat], zoom: Math.max(instance.getZoom(), 13) })
    }
  }, [lat, lng])

  return (
    <div className="relative h-64 w-full border border-line">
      <div ref={container} className="h-full w-full" />
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
    </div>
  )
}
