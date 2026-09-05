import { toIcs } from '@/lib/ics'
import { getPublishedBySlug } from '@/lib/hackathons/repo'

export async function GET(
  _request: Request,
  context: RouteContext<'/api/hackathons/[slug]/ics'>
) {
  const { slug } = await context.params
  const event = await getPublishedBySlug(slug)

  if (!event) {
    return new Response('Hackathon sa nenašiel.', { status: 404 })
  }

  const ics = toIcs(
    {
      id: event.id!,
      name: event.name!,
      description: event.description,
      start_at: event.start_at!,
      end_at: event.end_at!,
      url: event.url,
      venue_name: event.venue_name,
      address: event.address,
      city: event.city,
    },
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  )

  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${event.slug}.ics"`,
    },
  })
}
