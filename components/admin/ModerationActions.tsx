'use client'

import { useActionState } from 'react'
import { moderateAction, type AdminActionState } from '@/app/admin/actions'
import type { Database } from '@/lib/db/database.types'

type Decision = {
  status: Database['public']['Enums']['hackathon_status']
  label: string
  primary?: boolean
}

type Props = {
  id: string
  decisions: Decision[]
}

const initial: AdminActionState = { error: null, ok: null }

const button =
  'border border-line px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-muted transition-colors hover:border-ink hover:text-ink disabled:opacity-50'
const primaryButton =
  'bg-accent px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-accent-ink transition-transform hover:-translate-y-0.5 disabled:opacity-50'

export function ModerationActions({ id, decisions }: Props) {
  const [state, formAction, pending] = useActionState(moderateAction, initial)

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />

      {decisions.map((decision) => (
        <button
          key={decision.status}
          type="submit"
          name="status"
          value={decision.status}
          disabled={pending}
          className={decision.primary ? primaryButton : button}
        >
          {decision.label}
        </button>
      ))}

      {state.error && (
        <p className="w-full border-l-4 border-accent bg-ink p-2 text-xs text-ground">
          {state.error}
        </p>
      )}
    </form>
  )
}
