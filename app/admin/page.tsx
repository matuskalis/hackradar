import type { Metadata } from 'next'
import Link from 'next/link'
import { ModerationActions } from '@/components/admin/ModerationActions'
import { requireAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/db/supabase'
import type { Database } from '@/lib/db/database.types'
import { FORMATS } from '@/lib/taxonomy'
import { cn } from '@/lib/utils'
import { signOutAction } from './actions'

export const metadata: Metadata = {
  title: 'Administrácia',
  robots: { index: false, follow: false },
}

const TABS = {
  pending: 'Na schválenie',
  published: 'Zverejnené',
  attention: 'Vyžaduje pozornosť',
} as const

type Tab = keyof typeof TABS

const COLUMNS =
  'id, slug, name, start_at, end_at, timezone, format, city, country_code, source, source_url, url, organizer_name, lat, lng, edited_at'

type AdminRow = Pick<
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
>

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function toTab(value: string | undefined): Tab {
  return value === 'published' || value === 'attention' ? value : 'pending'
}

/** PostgREST reads its filter values as a small grammar; these break it. */
function cleanSearch(value: string | undefined): string {
  return (value ?? '').replace(/[%,()\\*]/g, '').trim().slice(0, 60)
}

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

async function loadRows(
  status: 'pending' | 'published',
  search: string
): Promise<AdminRow[]> {
  const db = createAdminClient()
  let query = db
    .from('hackathons_admin')
    .select(COLUMNS)
    .eq('status', status)
    .order('start_at', { ascending: true })
    .limit(200)

  if (search) query = query.ilike('name', `%${search}%`)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export default async function AdminPage({ searchParams }: PageProps<'/admin'>) {
  const email = await requireAdmin()
  const params = await searchParams
  const tab = toTab(first(params.tab))
  const search = cleanSearch(first(params.q))

  const rows = tab === 'attention' ? [] : await loadRows(tab, search)

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Administrácia</h1>
        <form action={signOutAction} className="flex items-center gap-3">
          <span className="data text-xs text-muted">{email}</span>
          <button
            type="submit"
            className="border border-line px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted transition-colors hover:border-ink hover:text-ink"
          >
            Odhlásiť
          </button>
        </form>
      </div>

      <nav className="mt-6 flex flex-wrap gap-2 border-b border-line pb-3">
        {(Object.keys(TABS) as Tab[]).map((key) => (
          <Link
            key={key}
            href={`/admin?tab=${key}`}
            className={cn(
              'border border-line px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted transition-colors hover:border-ink hover:text-ink',
              key === tab && 'border-ink bg-ink text-ground hover:text-ground'
            )}
          >
            {TABS[key]}
          </Link>
        ))}
        <Link
          href="/admin/new"
          className="ml-auto border border-accent px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-accent transition-colors hover:bg-accent hover:text-accent-ink"
        >
          Pridať z URL
        </Link>
      </nav>

      {tab === 'published' && (
        <form action="/admin" className="mt-6 flex flex-wrap gap-2">
          <input type="hidden" name="tab" value="published" />
          <input
            name="q"
            defaultValue={search}
            placeholder="Hľadať podľa názvu"
            className="w-full max-w-xs border border-line bg-ground px-3 py-2 text-sm text-ink"
          />
          <button
            type="submit"
            className="border border-line px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-muted transition-colors hover:border-ink hover:text-ink"
          >
            Hľadať
          </button>
        </form>
      )}

      {tab === 'attention' ? (
        <p className="mt-8 border-l-4 border-line bg-surface p-4 text-sm text-muted">
          Pripravujeme. Táto záložka bude zbierať ďalšie ročníky na potvrdenie a
          podujatia, ktoré sa možno opakovali.
        </p>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {rows.length === 0 && (
            <li className="border border-line p-4 text-sm text-muted">
              {tab === 'pending' ? 'Žiadne čakajúce podujatia.' : 'Nič sa nenašlo.'}
            </li>
          )}

          {rows.map((row) => (
            <li key={row.id} className="border border-line p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-lg font-bold tracking-tight">{row.name}</h2>
                <span className="data text-[11px] uppercase tracking-[0.12em] text-muted">
                  {row.source} {row.edited_at && '· upravené'}
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
                <ModerationActions
                  id={row.id!}
                  decisions={
                    tab === 'pending'
                      ? [
                          { status: 'published', label: 'Schváliť', primary: true },
                          { status: 'rejected', label: 'Zamietnuť' },
                        ]
                      : [{ status: 'cancelled', label: 'Zrušiť podujatie' }]
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
