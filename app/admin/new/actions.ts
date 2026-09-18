'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import type { AdminActionState } from '@/app/admin/actions'
import type { EditableHackathon } from '@/components/admin/HackathonEditForm'
import { invalidFieldsMessage, isMissingLocation, NEEDS_LOCATION } from '@/lib/admin/errors'
import { formValuesFromExtraction } from '@/lib/admin/extracted-to-form'
import { revalidatePublic } from '@/lib/admin/revalidate'
import { requireAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/db/supabase'
import { extractEventFromHtml } from '@/lib/extract/event-from-html'
import { fetchPage } from '@/lib/extract/fetch-page'
import { geocode } from '@/lib/geocode'
import { upsertHackathon } from '@/lib/hackathons/upsert'
import { adminEditSchema } from '@/lib/validation/schemas'

export type Extraction = {
  initial: EditableHackathon
  missing: string[]
  warnings: string[]
  sourceUrl: string
}

export type ExtractState = { error: string | null; result: Extraction | null }

const urlSchema = z.url().refine(
  (value) => value.startsWith('http://') || value.startsWith('https://'),
  { message: 'only http and https' }
)

const statusSchema = z.enum(['published', 'pending']).default('published')

/** `fetchPage` refuses in English; the admin reads Slovak. */
function fetchErrorMessage(error: unknown): string {
  const name = error instanceof Error ? error.name : ''
  if (name === 'TimeoutError' || name === 'AbortError') {
    return 'Stránka neodpovedala do 8 sekúnd.'
  }

  const message = error instanceof Error ? error.message : ''
  if (message.includes('private address')) {
    return 'Odkaz smeruje do internej siete, načítanie je zakázané.'
  }
  if (message.includes('cannot resolve')) return 'Doménu sa nepodarilo preložiť.'
  if (message.includes('larger than')) return 'Stránka je väčšia než 2 MB.'
  if (message.includes('expected text/html')) return 'Odkaz nevracia HTML stránku.'
  if (message.includes('redirects')) return 'Odkaz má príliš veľa presmerovaní.'
  if (message.includes('fetch failed:')) return 'Stránka sa nenačítala, server vrátil chybu.'
  return 'Stránku sa nepodarilo načítať. Skúste iný odkaz.'
}

export async function extractFromUrlAction(
  _state: ExtractState,
  formData: FormData
): Promise<ExtractState> {
  await requireAdmin()

  const parsed = urlSchema.safeParse(formData.get('url'))
  if (!parsed.success) {
    return { error: 'Zadajte platný odkaz začínajúci http:// alebo https://.', result: null }
  }

  let page
  try {
    page = await fetchPage(parsed.data)
  } catch (error) {
    console.error('add by url: fetch failed', error)
    return { error: fetchErrorMessage(error), result: null }
  }

  const { fields, missing, warnings } = extractEventFromHtml(page.html, page.finalUrl)

  return {
    error: null,
    result: {
      initial: formValuesFromExtraction(fields, page.finalUrl),
      missing,
      warnings,
      sourceUrl: page.finalUrl,
    },
  }
}

export async function createHackathonAction(
  _state: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin()

  const parsed = adminEditSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    themes: formData.getAll('themes'),
  })
  if (!parsed.success) return { error: invalidFieldsMessage(parsed.error), ok: null }

  const status = statusSchema.safeParse(formData.get('status') ?? undefined)
  if (!status.success) return { error: 'Neplatný stav podujatia.', ok: null }

  const sourceUrl = urlSchema.safeParse(formData.get('source_url'))
  const db = createAdminClient()
  const event = parsed.data

  let point = event.lat != null && event.lng != null
    ? { lat: event.lat, lng: event.lng, precision: event.location_precision ?? 'city' }
    : null

  if (!point && event.format !== 'online') {
    try {
      point = await geocode(db, event)
    } catch (error) {
      console.error('add by url: geocode failed', error)
    }
  }

  let result
  try {
    result = await upsertHackathon(db, {
      ...event,
      lat: point?.lat ?? null,
      lng: point?.lng ?? null,
      location_precision: point?.precision ?? null,
      source: 'manual',
      source_url: sourceUrl.success ? sourceUrl.data : null,
      status: status.data,
    })
    revalidatePublic(result.slug)
  } catch (error) {
    if (isMissingLocation(error)) return { error: NEEDS_LOCATION, ok: null }
    console.error('add by url: create failed', error)
    return { error: 'Uloženie zlyhalo. Skúste to znova.', ok: null }
  }

  const existed = result.action !== 'inserted'
  redirect(`/admin/hackathon/${result.id}${existed ? '?duplicate=1' : ''}`)
}
