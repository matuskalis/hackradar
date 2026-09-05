import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublishedBySlug } from '@/lib/hackathons/repo'
import { ELIGIBILITY, FORMATS, THEMES } from '@/lib/taxonomy'
import type { EligibilitySlug, ThemeSlug } from '@/lib/taxonomy'

const dateTimeFormat = new Intl.DateTimeFormat('sk-SK', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export async function generateMetadata({
  params,
}: PageProps<'/hackathon/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const event = await getPublishedBySlug(slug)
  if (!event) return { title: 'Hackathon sa nenašiel' }

  return {
    title: event.name,
    description:
      event.description?.slice(0, 160) ??
      `${event.name} — ${event.city ?? 'online'}, ${dateTimeFormat.format(new Date(event.start_at!))}`,
  }
}

export default async function HackathonPage({ params }: PageProps<'/hackathon/[slug]'>) {
  const { slug } = await params
  const event = await getPublishedBySlug(slug)
  if (!event) notFound()

  const place = [event.venue_name, event.address, event.city].filter(Boolean).join(', ')
  const isFree = event.price_cents === 0

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    startDate: event.start_at,
    endDate: event.end_at,
    eventAttendanceMode:
      event.format === 'online'
        ? 'https://schema.org/OnlineEventAttendanceMode'
        : event.format === 'hybrid'
          ? 'https://schema.org/MixedEventAttendanceMode'
          : 'https://schema.org/OfflineEventAttendanceMode',
    description: event.description ?? undefined,
    url: event.url ?? undefined,
    organizer: event.organizer_name ? { '@type': 'Organization', name: event.organizer_name } : undefined,
    location:
      event.format === 'online'
        ? { '@type': 'VirtualLocation', url: event.registration_url ?? event.url ?? undefined }
        : {
            '@type': 'Place',
            name: event.venue_name ?? event.city ?? undefined,
            address: {
              '@type': 'PostalAddress',
              streetAddress: event.address ?? undefined,
              addressLocality: event.city ?? undefined,
              addressCountry: event.country_code ?? undefined,
            },
          },
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link href="/" className="text-sm text-stone-500 hover:text-stone-800">
        ← Späť na mapu
      </Link>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance">
        {event.name}
      </h1>

      <dl className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">Termín</dt>
          <dd className="mt-1">
            {dateTimeFormat.format(new Date(event.start_at!))} –{' '}
            {dateTimeFormat.format(new Date(event.end_at!))}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">Formát</dt>
          <dd className="mt-1">{FORMATS[event.format!]}</dd>
        </div>

        {place && (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">Miesto</dt>
            <dd className="mt-1">{place}</dd>
          </div>
        )}

        {event.organizer_name && (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Organizátor
            </dt>
            <dd className="mt-1">{event.organizer_name}</dd>
          </div>
        )}

        {event.registration_deadline && (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Registrácia do
            </dt>
            <dd className="mt-1">
              {dateTimeFormat.format(new Date(event.registration_deadline))}
            </dd>
          </div>
        )}

        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">Vstup</dt>
          <dd className="mt-1">
            {isFree
              ? 'Zadarmo'
              : event.price_cents != null
                ? `${(event.price_cents / 100).toFixed(2)} ${event.currency}`
                : 'Neuvedené'}
          </dd>
        </div>

        {event.eligibility && (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Pre koho
            </dt>
            <dd className="mt-1">
              {ELIGIBILITY[event.eligibility as EligibilitySlug] ?? event.eligibility}
            </dd>
          </div>
        )}

        {event.prizes && (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">Ceny</dt>
            <dd className="mt-1">{event.prizes}</dd>
          </div>
        )}
      </dl>

      {event.themes && event.themes.length > 0 && (
        <p className="mt-6 flex flex-wrap gap-2">
          {event.themes.map((theme) => (
            <span
              key={theme}
              className="rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-700"
            >
              {THEMES[theme as ThemeSlug] ?? theme}
            </span>
          ))}
        </p>
      )}

      {event.description && (
        <p className="mt-6 whitespace-pre-line leading-relaxed text-stone-700">
          {event.description}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-4">
        {(event.registration_url || event.url) && (
          <a
            href={event.registration_url ?? event.url!}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-orange-600 px-4 py-2 font-medium text-white hover:bg-orange-700"
          >
            Registrovať sa
          </a>
        )}
        <a
          href={`/api/hackathons/${event.slug}/ics`}
          className="text-sm text-stone-700 underline underline-offset-2"
        >
          Pridať do kalendára
        </a>
      </div>

      {event.source === 'hackclub' && (
        <p className="mt-8 text-xs text-stone-500">
          Zdroj:{' '}
          <a
            href="https://hackathons.hackclub.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            Hack Club Hackathons
          </a>
        </p>
      )}
    </main>
  )
}
