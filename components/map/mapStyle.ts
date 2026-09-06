import type {
  CircleLayerSpecification,
  SymbolLayerSpecification,
} from 'maplibre-gl'
import type maplibregl from 'maplibre-gl'

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

/** Fill layers that carry no information for us but a lot of colour. */
const CLUTTER_FILL =
  /landcover|landuse|park|building|wood|grass|sand|wetland|ice|glacier|pitch|cemetery|hospital|school/

const ROAD = /^(highway|road|bridge|tunnel)/
const COUNTRY_BOUNDARY = /boundary_(country|2$)/
const REGION_BOUNDARY = /boundary_(state|3$)/

/**
 * Calms the hosted base map so our pins stay the loudest thing on it, and
 * lifts country borders so the region reads at a glance.
 *
 * Layer ids differ between the light and dark styles, so layers are matched by
 * pattern rather than by name. Every write is guarded: a style can drop or
 * rename a layer at any time and that must not break the map.
 */
export function calmBasemap(map: maplibregl.Map, dark: boolean): void {
  // On a near-black map a light line reads much louder than a dark line does
  // on paper, so the dark variant is deliberately softer.
  const ink = dark ? '#B4B4B4' : '#1A1A1A'

  const set = (id: string, property: string, value: unknown) => {
    try {
      map.setPaintProperty(id, property, value as never)
    } catch {
      // Layer gone or property not supported; the base map still renders.
    }
  }

  for (const layer of map.getStyle().layers) {
    const { id, type } = layer

    if (type === 'fill' && CLUTTER_FILL.test(id)) {
      set(id, 'fill-opacity', dark ? 0.3 : 0.35)
    } else if (type === 'symbol' && id.startsWith('poi')) {
      try {
        map.setLayoutProperty(id, 'visibility', 'none')
      } catch {
        // Same reasoning as above.
      }
    } else if ((type === 'line' || type === 'fill') && ROAD.test(id)) {
      set(id, `${type}-opacity`, dark ? 0.45 : 0.55)
    } else if (type === 'line' && COUNTRY_BOUNDARY.test(id)) {
      set(id, 'line-color', ink)
      set(id, 'line-opacity', dark ? 0.7 : 0.9)
      set(id, 'line-blur', 0)
      set(id, 'line-width', [
        'interpolate',
        ['linear'],
        ['zoom'],
        3, 1.2,
        6, 2.2,
        10, 3,
      ])
    } else if (type === 'line' && REGION_BOUNDARY.test(id)) {
      set(id, 'line-color', ink)
      set(id, 'line-opacity', dark ? 0.22 : 0.35)
    }
  }
}
