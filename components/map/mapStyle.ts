import type { CircleLayerSpecification, SymbolLayerSpecification } from 'maplibre-gl'

/**
 * Format colours, mirroring the --color-onsite/hybrid/online tokens in
 * globals.css. MapLibre paint expressions cannot read CSS variables, so the
 * values are repeated here and must be changed in both places together.
 */
export const FORMAT_COLORS = {
  onsite: '#ff3b00',
  hybrid: '#7a00ff',
  online: '#0057ff',
} as const

export const clusterLayer: CircleLayerSpecification = {
  id: 'clusters',
  type: 'circle',
  source: 'venues',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': '#0a0a0a',
    'circle-opacity': 0.92,
    'circle-radius': ['step', ['get', 'point_count'], 15, 5, 20, 20, 27],
    'circle-stroke-width': 2,
    'circle-stroke-color': '#ff3b00',
  },
}

export const clusterCountLayer: SymbolLayerSpecification = {
  id: 'cluster-count',
  type: 'symbol',
  source: 'venues',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': ['get', 'point_count_abbreviated'],
    'text-font': ['Noto Sans Bold'],
    'text-size': 12,
    'text-allow-overlap': true,
  },
  paint: { 'text-color': '#ffffff' },
}

export const venuePinLayer: CircleLayerSpecification = {
  id: 'venue-pins',
  type: 'circle',
  source: 'venues',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': [
      'match',
      ['get', 'format'],
      'hybrid', FORMAT_COLORS.hybrid,
      'online', FORMAT_COLORS.online,
      FORMAT_COLORS.onsite,
    ],
    'circle-radius': [
      'case',
      ['boolean', ['feature-state', 'selected'], false], 12,
      ['boolean', ['feature-state', 'hovered'], false], 10,
      7,
    ],
    'circle-stroke-width': [
      'case',
      ['boolean', ['feature-state', 'selected'], false], 3,
      2,
    ],
    'circle-stroke-color': '#0a0a0a',
  },
}

/**
 * City-level matches have no street address, so they are drawn as an area
 * rather than a pin that would claim a precision we do not have.
 */
export const cityAreaLayer: CircleLayerSpecification = {
  id: 'city-areas',
  type: 'circle',
  source: 'cities',
  paint: {
    'circle-color': [
      'match',
      ['get', 'format'],
      'hybrid', FORMAT_COLORS.hybrid,
      'online', FORMAT_COLORS.online,
      FORMAT_COLORS.onsite,
    ],
    'circle-opacity': [
      'case',
      ['boolean', ['feature-state', 'selected'], false], 0.45,
      0.22,
    ],
    'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 6, 12, 28],
    'circle-stroke-width': 1,
    'circle-stroke-color': [
      'match',
      ['get', 'format'],
      'hybrid', FORMAT_COLORS.hybrid,
      'online', FORMAT_COLORS.online,
      FORMAT_COLORS.onsite,
    ],
  },
}

export const cityDotLayer: CircleLayerSpecification = {
  id: 'city-dots',
  type: 'circle',
  source: 'cities',
  paint: {
    'circle-color': '#0a0a0a',
    'circle-radius': 2,
    'circle-stroke-width': 1,
    'circle-stroke-color': '#ffffff',
  },
}
