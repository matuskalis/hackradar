import type { NextConfig } from 'next'

/**
 * The map needs a wide-open connect-src: MapLibre fetches style, glyphs, sprites
 * and tiles from the tile host, and the geocoder proxy is server-side only.
 * Everything else is locked down. `unsafe-inline` for styles is required by
 * MapLibre's own injected styles; scripts do not need it because Next serves
 * its bundles from the same origin and JSON-LD is escaped, not executed.
 */
const TILE_HOSTS = 'https://tiles.openfreemap.org https://*.openfreemap.org'

// React's development build uses eval(); its production build never does, so
// the relaxation is scoped to `next dev` and never ships.
const scriptSrc =
  process.env.NODE_ENV === 'development'
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'"

const csp = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: " + TILE_HOSTS,
  "font-src 'self' data:",
  "connect-src 'self' " + TILE_HOSTS,
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), payment=(), geolocation=(self)' },
]

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig
