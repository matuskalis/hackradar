import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MapExplorer } from '@/components/explore/MapExplorer'
import { CITIES, findCity } from '@/lib/cities'
import { listUpcomingNear } from '@/lib/hackathons/repo'

export const revalidate = 3600

export function generateStaticParams() {
  return CITIES.map((city) => ({ city: city.slug }))
}

export async function generateMetadata({
  params,
}: PageProps<'/hackathony/[city]'>): Promise<Metadata> {
  const { city: slug } = await params
  const city = findCity(slug)
  if (!city) return { title: 'Mesto sa nenašlo' }

  return {
    title: `Hackathony ${city.name}`,
    description: `Nadchádzajúce hackathony v okolí mesta ${city.name} do ${city.radiusKm} km. Termíny, témy a odkazy na registráciu.`,
    alternates: { canonical: `/hackathony/${city.slug}` },
  }
}

export default async function CityPage({ params }: PageProps<'/hackathony/[city]'>) {
  const { city: slug } = await params
  const city = findCity(slug)
  if (!city) notFound()

  const items = await listUpcomingNear({ lat: city.lat, lng: city.lng }, city.radiusKm)

  return (
    <MapExplorer
      initialCenter={{ lat: city.lat, lng: city.lng }}
      initialLabel={city.name}
      initialItems={items}
    />
  )
}
