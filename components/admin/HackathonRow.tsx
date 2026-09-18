import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Database } from '@/lib/db/database.types'
import { FORMATS } from '@/lib/taxonomy'

/** The columns every admin list reads. Kept next to the card that renders them. */
export const ADMIN_ROW_COLUMNS =
  'id, slug, name, start_at, end_at, timezone, format, city, country_code, source, source_url, url, organizer_name, lat, lng, edited_at, recurrence, parent_id'

export type AdminRow = Pick<
  Database['public']['Views']['hackathons_admin']['Row'],
  | 'id'
  | 'slug'
  | 'name'
  | 'start_at'
  | 'end_at'
  | 'timezone'
  | 'format'
  | 'city'
  | 'country_code'
  | 'source'
  | 'source_url'
  | 'url'
  | 'organizer_name'
  | 'lat'
  | 'lng'
  | 'edited_at'
  | 'recurrence'
  | 'parent_id'
>

/** Dates belong to the event, not to the server the page renders on. */
function stamp(value: string | null, timeZone: string | null): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('sk-SK', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timeZone ?? undefined,
  }).format(new Date(value))
}

export function HackathonRow({
  row,
  children,
}: {
  row: AdminRow
  children: ReactNode
}) {
  return (
    <li className="border border-line p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg font-bold tracking-tight">{row.name}</h2>
        <span className="data text-[11px] uppercase tracking-[0.12em] text-muted">
          {row.source} {row.recurrence === 'annual' && '· každoročne'}{' '}
          {row.edited_at && '· upravené'}
        </span>
      </div>

      <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        <div className="flex gap-2">
          <dt className="label">Termín</dt>
          <dd className="data text-xs">
            {stamp(row.start_at, row.timezone)} – {stamp(row.end_at, row.timezone)}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="label">Formát</dt>
          <dd className="text-xs">
            {row.format ? FORMATS[row.format] : '—'}
            {row.format !== 'online' && row.lat == null && ' · bez súradníc'}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="label">Mesto</dt>
          <dd className="text-xs">
            {row.city ?? '—'} {row.country_code ?? ''}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="label">Organizátor</dt>
          <dd className="text-xs">{row.organizer_name ?? '—'}</dd>
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <dt className="label">Odkaz</dt>
          <dd className="truncate text-xs">
            {row.url ? (
              <a
                href={row.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                {row.url}
              </a>
            ) : (
              '—'
            )}
          </dd>
        </div>
        {row.source_url && row.source_url !== row.url && (
          <div className="flex gap-2 sm:col-span-2">
            <dt className="label">Zdroj</dt>
            <dd className="truncate text-xs">{row.source_url}</dd>
          </div>
        )}
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link
          href={`/admin/hackathon/${row.id}`}
          className="border border-line px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted transition-colors hover:border-ink hover:text-ink"
        >
          Upraviť
        </Link>
        {children}
      </div>
    </li>
  )
}
