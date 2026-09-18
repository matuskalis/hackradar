import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ADMIN_ROW_COLUMNS,
  HackathonRow,
  type AdminRow,
} from '@/components/admin/HackathonRow'
import { MarkRecurringButton } from '@/components/admin/MarkRecurringButton'
import { ModerationActions } from '@/components/admin/ModerationActions'
import { RunRecurringButton } from '@/components/admin/RunRecurringButton'
import { requireAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/db/supabase'
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

/** How long after an event we start asking whether it happens again. */
const ENDED_DAYS = 14

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

async function loadRows(
  status: 'pending' | 'published',
  search: string
): Promise<AdminRow[]> {
  const db = createAdminClient()
  let query = db
    .from('hackathons_admin')
    .select(ADMIN_ROW_COLUMNS)
    .eq('status', status)
    .order('start_at', { ascending: true })
    .limit(200)

  if (search) query = query.ilike('name', `%${search}%`)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

type Attention = { editions: AdminRow[]; maybeRecurring: AdminRow[] }

/**
 * Two questions the curator has to answer by hand: is the guessed date of a
 * rolled-forward edition right, and did an event nobody marked as recurring
 * happen again?
 */
async function loadAttention(): Promise<Attention> {
  const db = createAdminClient()
  const endedBefore = new Date(Date.now() - ENDED_DAYS * 86_400_000).toISOString()

  const [editions, ended, children] = await Promise.all([
    db
      .from('hackathons_admin')
      .select(ADMIN_ROW_COLUMNS)
      .eq('status', 'pending')
      .not('parent_id', 'is', null)
      .order('start_at', { ascending: true })
      .limit(200),
    db
      .from('hackathons_admin')
      .select(ADMIN_ROW_COLUMNS)
      .eq('status', 'published')
      .eq('recurrence', 'none')
      .lt('end_at', endedBefore)
      .order('end_at', { ascending: false })
      .limit(200),
    db.from('hackathons').select('parent_id').not('parent_id', 'is', null),
  ])

  if (editions.error) throw editions.error
  if (ended.error) throw ended.error
  if (children.error) throw children.error

  const rolled = new Set((children.data ?? []).map((child) => child.parent_id))

  return {
    editions: editions.data ?? [],
    maybeRecurring: (ended.data ?? []).filter((row) => !rolled.has(row.id)),
  }
}

function EmptyNote({ children }: { children: string }) {
  return <li className="border border-line p-4 text-sm text-muted">{children}</li>
}

export default async function AdminPage({ searchParams }: PageProps<'/admin'>) {
  const email = await requireAdmin()
  const params = await searchParams
  const tab = toTab(first(params.tab))
  const search = cleanSearch(first(params.q))

  const rows = tab === 'attention' ? [] : await loadRows(tab, search)
  const attention = tab === 'attention' ? await loadAttention() : null

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

      {attention ? (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border border-line p-4">
            <p className="text-sm text-muted">
              Ďalšie ročníky sa vytvárajú automaticky každý deň. Môžete ich vyrobiť
              aj hneď.
            </p>
            <RunRecurringButton />
          </div>

          <h2 className="mt-8 text-sm font-bold uppercase tracking-[0.12em]">
            Ďalší ročník, potvrďte termín
          </h2>
          <p className="mt-1 text-sm text-muted">
            Termín je odhad: rovnaký víkend o 52 týždňov neskôr. Overte ho na stránke
            organizátora a podujatie zverejnite alebo zamietnite.
          </p>
          <ul className="mt-4 flex flex-col gap-4">
            {attention.editions.length === 0 && (
              <EmptyNote>Žiadne nové ročníky na potvrdenie.</EmptyNote>
            )}
            {attention.editions.map((row) => (
              <HackathonRow key={row.id} row={row}>
                <ModerationActions
                  id={row.id!}
                  decisions={[
                    { status: 'published', label: 'Schváliť', primary: true },
                    { status: 'rejected', label: 'Zamietnuť' },
                  ]}
                />
              </HackathonRow>
            ))}
          </ul>

          <h2 className="mt-10 text-sm font-bold uppercase tracking-[0.12em]">
            Konalo sa to znova?
          </h2>
          <p className="mt-1 text-sm text-muted">
            Podujatia, ktoré skončili pred viac ako {ENDED_DAYS} dňami a nemajú
            označené opakovanie.
          </p>
          <ul className="mt-4 flex flex-col gap-4">
            {attention.maybeRecurring.length === 0 && (
              <EmptyNote>Nič nečaká na rozhodnutie.</EmptyNote>
            )}
            {attention.maybeRecurring.map((row) => (
              <HackathonRow key={row.id} row={row}>
                <MarkRecurringButton id={row.id!} />
              </HackathonRow>
            ))}
          </ul>
        </>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {rows.length === 0 && (
            <EmptyNote>
              {tab === 'pending' ? 'Žiadne čakajúce podujatia.' : 'Nič sa nenašlo.'}
            </EmptyNote>
          )}

          {rows.map((row) => (
            <HackathonRow key={row.id} row={row}>
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
            </HackathonRow>
          ))}
        </ul>
      )}
    </main>
  )
}
