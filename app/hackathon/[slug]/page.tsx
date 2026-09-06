import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { VenuePreview } from '@/components/map/VenuePreview'
import type { HackathonCard } from '@/lib/db/types'
import { getPublishedBySlug } from '@/lib/hackathons/repo'
import { ELIGIBILITY, FORMATS, THEMES } from '@/lib/taxonomy'
import type { EligibilitySlug, ThemeSlug } from '@/lib/taxonomy'

const FORMAT_BG: Record<string, string> = {
  onsite: 'bg-onsite',
  online: 'bg-online',
  hybrid: 'bg-hybrid',
}

const dateFormat = new Intl.DateTimeFormat('sk-SK', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const timeFormat = new Intl.DateTimeFormat('sk-SK', {
  hour: '2-digit',
  minute: '2-digit',
})

function stamp(value: string): string {
  const date = new Date(value)
  return `${dateFormat.format(date)}, ${timeFormat.format(date)}`
}

function daysUntil(deadline: string): number {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000)
}

export async function generateMetadata({
  params,
}: PageProps<'/hackathon/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const event = await getPublishedBySlug(slug)
  if (!event) return { title: 'Hackathon sa nenašiel' }

  return {
    title: event.name!,
    description:
      event.description?.slice(0, 160) ??
      `${event.name} — ${event.city ?? 'online'}, ${dateFormat.format(new Date(event.start_at!))}`,
  }
}

export default async function HackathonPage({ params }: PageProps<'/hackathon/[slug]'>) {
  const { slug } = await params
  const event = await getPublishedBySlug(slug)
  if (!event) notFound()

  const place = [event.venue_name, event.address, event.city].filter(Boolean).join(', ')
  const isFree = event.price_cents === 0
  const left = event.registration_deadline ? daysUntil(event.registration_deadline) : null

  const facts: Array<[string, string]> = [
    ['Termín', `${stamp(event.start_at!)} → ${stamp(event.end_at!)}`],
    ['Formát', FORMATS[event.format!]],
  ]
  if (place) facts.push(['Miesto', place])
  if (event.organizer_name) facts.push(['Organizátor', event.organizer_name])
  if (event.registration_deadline) {
    facts.push(['Registrácia do', stamp(event.registration_deadline)])
  }
  facts.push([
    'Vstup',
    isFree
      ? 'Zadarmo'
      : event.price_cents != null
        ? `${(event.price_cents / 100).toFixed(2)} ${event.currency}`
        : 'Neuvedené',
  ])
  if (event.eligibility) {
    facts.push([
      'Pre koho',
      ELIGIBILITY[event.eligibility as EligibilitySlug] ?? event.eligibility,
    ])
  }
  if (event.prizes) facts.push(['Ceny', event.prizes])
  if (event.capacity) facts.push(['Kapacita', String(event.capacity)])

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
    organizer: event.organizer_name
      ? { '@type': 'Organization', name: event.organizer_name }
      : undefined,
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
    <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6 md:pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/"
        className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted hover:text-accent"
      >
        ← Späť na mapu
      </Link>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span
          className={`${FORMAT_BG[event.format!]} px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-accent-ink`}
        >
          {FORMATS[event.format!]}
        </span>
        {event.city && (
          <span className="data border border-line px-2 py-1 text-[11px] uppercase tracking-[0.1em]">
            {event.city}
            {event.country_code ? ` · ${event.country_code}` : ''}
          </span>
        )}
        {isFree && (
          <span className="border border-line px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
            Zadarmo
          </span>
        )}
      </div>

      <h1 className="mt-3 text-4xl font-bold leading-[1.05] tracking-tight text-balance md:text-5xl">
        {event.name}
      </h1>

      {left != null && left >= 0 && (
        <p className="mt-4 inline-block bg-accent px-3 py-1.5 text-sm font-bold uppercase tracking-[0.08em] text-accent-ink">
          {left === 0
            ? 'Registrácia končí dnes'
            : left === 1
              ? 'Registrácia končí zajtra'
              : `Do konca registrácie ${left} dní`}
        </p>
      )}

      {event.description && (
        <p className="mt-6 max-w-[62ch] whitespace-pre-line text-[17px] leading-relaxed text-ink">
          {event.description}
        </p>
      )}

      <dl className="mt-8 border-t border-line">
        {facts.map(([term, value]) => (
          <div
            key={term}
            className="grid grid-cols-1 gap-1 border-b border-line py-3 sm:grid-cols-[10rem_1fr] sm:gap-4"
          >
            <dt className="label pt-0.5">{term}</dt>
            <dd className="data text-sm leading-relaxed">{value}</dd>
          </div>
        ))}
      </dl>

      {event.themes && event.themes.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-1">
          {event.themes.map((theme) => (
            <span
              key={theme}
              className="border border-line px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted"
            >
              {THEMES[theme as ThemeSlug] ?? theme}
            </span>
          ))}
        </div>
      )}

      {event.lat != null && event.lng != null && (
        <div className="mt-8">
          <p className="label mb-2">
            {event.location_precision === 'city' ? 'Približná poloha' : 'Kde to je'}
          </p>
          <VenuePreview item={event as unknown as HackathonCard} />
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-4">
        {(event.registration_url || event.url) && (
          <a
            href={event.registration_url ?? event.url!}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-accent px-5 py-3 text-sm font-bold uppercase tracking-[0.1em] text-accent-ink transition-transform hover:-translate-y-0.5"
          >
            Registrovať sa
          </a>
        )}
        <a
          href={`/api/hackathons/${event.slug}/ics`}
          className="text-[11px] font-bold uppercase tracking-[0.1em] underline underline-offset-4 hover:text-accent"
        >
          Pridať do kalendára
        </a>
      </div>

      {event.source === 'hackclub' && (
        <p className="mt-10 text-[11px] uppercase tracking-[0.08em] text-muted">
          Zdroj:{' '}
          <a
            href="https://hackathons.hackclub.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4"
          >
            Hack Club Hackathons
          </a>
        </p>
      )}
    </main>
  )
}
