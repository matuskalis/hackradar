import { MapExplorer } from '@/components/explore/MapExplorer'
import { DEFAULT_CITY } from '@/lib/cities'

export default function HomePage() {
  return (
    <MapExplorer
      initialCenter={{ lat: DEFAULT_CITY.lat, lng: DEFAULT_CITY.lng }}
      initialLabel={DEFAULT_CITY.name}
    />
  )
}
