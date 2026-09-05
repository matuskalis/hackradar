import type { MetadataRoute } from 'next'
import { CITIES } from '@/lib/cities'
import { listPublishedSlugs } from '@/lib/hackathons/repo'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const events = await listPublishedSlugs()

  return [
    { url: siteUrl, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/pridat`, changeFrequency: 'monthly', priority: 0.4 },
    ...CITIES.map((city) => ({
      url: `${siteUrl}/hackathony/${city.slug}`,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...events.map((event) => ({
      url: `${siteUrl}/hackathon/${event.slug}`,
      lastModified: event.updated_at ?? undefined,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ]
}
