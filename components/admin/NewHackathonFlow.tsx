'use client'

import { useActionState, useState } from 'react'
import { extractFromUrlAction, type ExtractState } from '@/app/admin/new/actions'
import { HackathonEditForm } from '@/components/admin/HackathonEditForm'
import { blankFormValues } from '@/lib/admin/extracted-to-form'

const initial: ExtractState = { error: null, result: null }

const secondaryButton =
  'border border-line px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-muted transition-colors hover:border-ink hover:text-ink disabled:opacity-50'

/**
 * Two steps in one place: paste a URL and let the extractor prefill the form,
 * or skip it and type everything. Both end in the same form, which is the only
 * thing that writes.
 */
export function NewHackathonFlow() {
  const [state, formAction, pending] = useActionState(extractFromUrlAction, initial)
  const [manual, setManual] = useState(false)

  if (state.result) {
    const { initial: values, missing, warnings, sourceUrl } = state.result
    return (
      <div className="flex flex-col gap-6">
        <p className="data break-all text-xs text-muted">Zdroj: {sourceUrl}</p>

        {missing.length > 0 && (
          <p className="border-l-4 border-accent bg-surface p-3 text-sm text-muted">
            Niektoré polia sa zo stránky nepodarilo prečítať ({missing.length}). Sú
            zvýraznené nižšie.
          </p>
        )}

        {warnings.length > 0 && (
          <ul className="flex flex-col gap-1 border border-line p-3 text-xs text-muted">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        )}

        <HackathonEditForm event={values} missing={missing} sourceUrl={sourceUrl} />
      </div>
    )
  }

  if (manual) {
    return <HackathonEditForm event={blankFormValues()} />
  }

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-2">
        <label htmlFor="url" className="label">
          Odkaz na stránku podujatia
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id="url"
            name="url"
            type="url"
            required
            placeholder="https://..."
            className="w-full max-w-lg border border-line bg-ground px-3 py-2 text-sm text-ink"
          />
          <button
            type="submit"
            disabled={pending}
            className="bg-accent px-5 py-2 text-sm font-bold uppercase tracking-[0.1em] text-accent-ink transition-transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {pending ? 'Načítavam…' : 'Načítať'}
          </button>
        </div>
        <p className="text-xs text-muted">
          Stránku načítame na serveri a prečítame z nej údaje o podujatí. Nič sa
          neuloží, kým formulár nepotvrdíte.
        </p>
      </form>

      {state.error && (
        <p className="border-l-4 border-accent bg-ink p-3 text-sm text-ground">
          {state.error}
        </p>
      )}

      <button type="button" onClick={() => setManual(true)} className={`${secondaryButton} self-start`}>
        Vyplniť ručne
      </button>
    </div>
  )
}
