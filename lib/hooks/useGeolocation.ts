'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type GeolocationStatus =
  | 'idle'
  | 'loading'
  | 'granted'
  | 'denied'
  | 'unsupported'

export type Coords = { lat: number; lng: number }

/**
 * Asks for the browser location only when permission was already granted, or
 * when the visitor presses the button. A cold prompt on page load reads as
 * hostile and gets denied.
 */
export function useGeolocation(onLocated?: (coords: Coords) => void) {
  const [status, setStatus] = useState<GeolocationStatus>('idle')
  const [coords, setCoords] = useState<Coords | null>(null)

  const report = useRef(onLocated)
  useEffect(() => {
    report.current = onLocated
  })

  const request = useCallback(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setStatus('unsupported')
      return
    }

    setStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setCoords(next)
        setStatus('granted')
        report.current?.(next)
      },
      () => setStatus('denied'),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 }
    )
  }, [])

  useEffect(() => {
    // Support is reported by request(); an effect must not set state directly.
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return
    if (!navigator.permissions?.query) return

    let cancelled = false
    navigator.permissions
      .query({ name: 'geolocation' })
      .then((permission) => {
        if (!cancelled && permission.state === 'granted') request()
      })
      .catch(() => {
        // Permissions API unavailable; wait for the button.
      })

    return () => {
      cancelled = true
    }
  }, [request])

  return { status, coords, request }
}
