'use client'

import dynamic from 'next/dynamic'
import { MapSkeleton } from './HackMap'
import type { HackathonCard } from '@/lib/db/types'

const HackMap = dynamic(() => import('./HackMap'), {
  ssr: false,
  loading: () => <MapSkeleton />,
})

type Props = {
  item: HackathonCard
}

const noop = () => {}

/** One venue, drawn with the same pin language as the main map. */
export function VenuePreview({ item }: Props) {
  return (
    <div className="h-64 border border-line">
      <HackMap
        items={[item]}
        center={{ lat: item.lat!, lng: item.lng! }}
        zoom={item.location_precision === 'venue' ? 14 : 11}
        selectedId={null}
        hoveredId={null}
        onSelect={noop}
        onHover={noop}
        onUserMove={noop}
        readOnly
      />
    </div>
  )
}
