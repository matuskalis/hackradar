'use client'

import { useActionState } from 'react'
import { setRecurrenceAction, type AdminActionState } from '@/app/admin/actions'

const initial: AdminActionState = { error: null, ok: null }

/** One click says "this series repeats"; the next roll creates the edition. */
export function MarkRecurringButton({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(setRecurrenceAction, initial)

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="recurrence" value="annual" />

      <button
        type="submit"
        disabled={pending}
        className="bg-accent px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-accent-ink transition-transform hover:-translate-y-0.5 disabled:opacity-50"
      >
        Opakuje sa každý rok
      </button>

      {(state.ok || state.error) && (
        <span className="text-xs text-muted">{state.error ?? state.ok}</span>
      )}
    </form>
  )
}
