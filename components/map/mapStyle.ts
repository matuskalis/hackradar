import type { CircleLayerSpecification, SymbolLayerSpecification } from 'maplibre-gl'

/** Format colours are also used by the list, so pins and cards agree. */
export const FORMAT_COLORS = {
  onsite: '#d9541e',
  hybrid: '#7a5cc4',
  online: '#2f7d8a',
} as const

export const clusterLayer: CircleLayerSpecification = {
  id: 'clusters',
  type: 'circle',
  source: 'venues',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': '#d9541e',
    'circle-opacity': 0.85,
    'circle-radius': ['step', ['get', 'point_count'], 16, 5, 22, 20, 30],
    'circle-stroke-width': 2,
    'circle-stroke-color': '#ffffff',
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
    'text-size': 13,
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
    'circle-stroke-color': '#ffffff',
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
    'circle-color': '#ffffff',
    'circle-radius': 2.5,
    'circle-stroke-width': 1,
    'circle-stroke-color': '#4a5462',
  },
}
