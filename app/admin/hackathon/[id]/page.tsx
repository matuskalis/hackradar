import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  HackathonEditForm,
  type EditableHackathon,
} from '@/components/admin/HackathonEditForm'
import { ModerationActions } from '@/components/admin/ModerationActions'
import { requireAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/db/supabase'

export const metadata: Metadata = {
  title: 'Úprava podujatia',
  robots: { index: false, follow: false },
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const STATUS_LABELS: Record<string, string> = {
  pending: 'čaká na schválenie',
  published: 'zverejnené',
  rejected: 'zamietnuté',
  cancelled: 'zrušené',
}

export default async function EditHackathonPage({
  params,
}: PageProps<'/admin/hackathon/[id]'>) {
  await requireAdmin()
  const { id } = await params
  if (!UUID.test(id)) notFound()

  const { data: row, error } = await createAdminClient()
    .from('hackathons_admin')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!row) notFound()

  const event: EditableHackathon = {
    id,
    name: row.name ?? '',
    description: row.description,
    start_at: new Date(row.start_at!).toISOString(),
    end_at: new Date(row.end_at!).toISOString(),
    timezone: row.timezone ?? 'Europe/Bratislava',
    format: row.format ?? 'onsite',
    venue_name: row.venue_name,
    address: row.address,
    city: row.city,
    country_code: row.country_code,
    lat: row.lat,
    lng: row.lng,
    location_precision: row.location_precision,
    url: row.url,
    registration_url: row.registration_url,
    registration_deadline: row.registration_deadline
      ? new Date(row.registration_deadline).toISOString()
      : null,
    themes: row.themes ?? [],
    eligibility: row.eligibility,
    price_cents: row.price_cents,
    currency: row.currency ?? 'EUR',
    prizes: row.prizes,
    capacity: row.capacity,
    organizer_name: row.organizer_name,
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link href="/admin" className="label underline underline-offset-4">
        Späť na zoznam
      </Link>

      <h1 className="mt-4 text-3xl font-bold tracking-tight">{event.name}</h1>
      <p className="mt-2 data text-xs uppercase tracking-[0.12em] text-muted">
        {STATUS_LABELS[row.status ?? ''] ?? row.status} · {row.source}
        {row.edited_at && ' · ručne upravené'}
      </p>

      <div className="mt-4">
        <ModerationActions
          id={id}
          decisions={[
            { status: 'published', label: 'Zverejniť', primary: true },
            { status: 'pending', label: 'Vrátiť na schválenie' },
            { status: 'rejected', label: 'Zamietnuť' },
            { status: 'cancelled', label: 'Zrušiť podujatie' },
          ]}
        />
      </div>

      <div className="mt-8">
        <HackathonEditForm event={event} />
      </div>
    </main>
  )
}
