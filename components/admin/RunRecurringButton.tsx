'use client'

import { useActionState } from 'react'
import { runRecurringAction, type AdminActionState } from '@/app/admin/actions'

const initial: AdminActionState = { error: null, ok: null }

export function RunRecurringButton() {
  const [state, formAction, pending] = useActionState(runRecurringAction, initial)

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <button
        type="submit"
        disabled={pending}
        className="bg-accent px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-accent-ink transition-transform hover:-translate-y-0.5 disabled:opacity-50"
      >
        {pending ? 'Spúšťam…' : 'Spustiť teraz'}
      </button>

      {(state.ok || state.error) && (
        <p className="text-xs text-muted">{state.error ?? state.ok}</p>
      )}
    </form>
  )
}
