'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { invalidFieldsMessage, isMissingLocation, NEEDS_LOCATION } from '@/lib/admin/errors'
import { revalidatePublic } from '@/lib/admin/revalidate'
import { requireAdmin } from '@/lib/auth/admin'
import { createAdminClient, createServerSupabaseClient } from '@/lib/db/supabase'
import { geocode } from '@/lib/geocode'
import { setStatus, updateByAdmin } from '@/lib/hackathons/moderation'
import { rollRecurringEvents } from '@/lib/hackathons/recurrence'
import { adminEditSchema } from '@/lib/validation/schemas'

export type AdminActionState = { error: string | null; ok: string | null }

const moderateSchema = z.object({
  id: z.uuid(),
  status: z.enum(['pending', 'published', 'rejected', 'cancelled']),
})

const recurrenceSchema = z.object({
  id: z.uuid(),
  recurrence: z.enum(['none', 'annual']),
})

export async function moderateAction(
  _state: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin()

  const parsed = moderateSchema.safeParse({
    id: formData.get('id'),
    status: formData.get('status'),
  })
  if (!parsed.success) return { error: 'Neplatná požiadavka.', ok: null }

  try {
    const row = await setStatus(createAdminClient(), parsed.data.id, parsed.data.status)
    revalidatePublic(row.slug)
  } catch (error) {
    if (isMissingLocation(error)) return { error: NEEDS_LOCATION, ok: null }
    console.error('moderation failed', error)
    return { error: 'Zmena stavu zlyhala. Skúste to znova.', ok: null }
  }

  return { error: null, ok: 'Hotovo.' }
}

export async function saveHackathonAction(
  _state: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin()

  const id = z.uuid().safeParse(formData.get('id'))
  if (!id.success) return { error: 'Neplatná požiadavka.', ok: null }

  const parsed = adminEditSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    themes: formData.getAll('themes'),
  })
  if (!parsed.success) {
    return { error: invalidFieldsMessage(parsed.error), ok: null }
  }

  try {
    const row = await updateByAdmin(createAdminClient(), id.data, parsed.data)
    revalidatePublic(row.slug)
  } catch (error) {
    if (isMissingLocation(error)) return { error: NEEDS_LOCATION, ok: null }
    console.error('admin edit failed', error)
    return { error: 'Uloženie zlyhalo. Skúste to znova.', ok: null }
  }

  return { error: null, ok: 'Uložené.' }
}

/**
 * "Opakuje sa každý rok" on the attention tab. Goes through `updateByAdmin`
 * like every other hand correction, so the claim is stamped with `edited_at`
 * and the next roll picks the event up.
 */
export async function setRecurrenceAction(
  _state: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin()

  const parsed = recurrenceSchema.safeParse({
    id: formData.get('id'),
    recurrence: formData.get('recurrence'),
  })
  if (!parsed.success) return { error: 'Neplatná požiadavka.', ok: null }

  try {
    const row = await updateByAdmin(createAdminClient(), parsed.data.id, {
      recurrence: parsed.data.recurrence,
    })
    revalidatePublic(row.slug)
  } catch (error) {
    console.error('recurrence change failed', error)
    return { error: 'Zmena zlyhala. Skúste to znova.', ok: null }
  }

  return { error: null, ok: 'Uložené.' }
}

/** The same job the daily cron runs, on demand. Takes no input. */
export async function runRecurringAction(): Promise<AdminActionState> {
  await requireAdmin()

  try {
    const counts = await rollRecurringEvents(createAdminClient(), new Date())
    revalidatePath('/admin')
    return {
      error: null,
      ok: `Hotovo: ${counts.created} nových ročníkov, ${counts.linked} prepojených s existujúcim záznamom.`,
    }
  } catch (error) {
    console.error('recurring roll failed', error)
    return { error: 'Spustenie zlyhalo. Skúste to znova.', ok: null }
  }
}

export type GeocodeResponse =
  | { ok: true; lat: number; lng: number; precision: 'venue' | 'city' }
  | { ok: false; error: string }

/** Used by the location picker's "geocode address" button. */
export async function geocodeAddressAction(parts: {
  address: string | null
  city: string | null
  country_code: string | null
}): Promise<GeocodeResponse> {
  await requireAdmin()

  try {
    const point = await geocode(createAdminClient(), parts)
    if (!point) return { ok: false, error: 'Adresu sa nepodarilo nájsť.' }
    return { ok: true, ...point }
  } catch (error) {
    console.error('admin geocode failed', error)
    return { ok: false, error: 'Geokódovanie je dočasne nedostupné.' }
  }
}

export async function signOutAction(): Promise<void> {
  await requireAdmin()
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
