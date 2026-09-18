'use client'

import { useActionState } from 'react'
import { sendMagicLink, type LoginState } from '@/app/admin/login/actions'

const field = 'w-full border border-line bg-ground px-3 py-2 text-sm text-ink'

const initial: LoginState = { error: null, sent: false }

export function LoginForm() {
  const [state, formAction, pending] = useActionState(sendMagicLink, initial)

  if (state.sent) {
    return (
      <div className="border-l-4 border-accent bg-ink p-6 text-ground">
        <h2 className="text-2xl font-bold tracking-tight">Skontrolujte poštu.</h2>
        <p className="mt-2 max-w-[46ch] text-sm opacity-80">
          Ak je adresa oprávnená, poslali sme na ňu prihlasovací odkaz.
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="label">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={field}
        />
      </div>

      {state.error && (
        <p className="border-l-4 border-accent bg-ink p-3 text-sm text-ground">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start bg-accent px-5 py-3 text-sm font-bold uppercase tracking-[0.1em] text-accent-ink transition-transform hover:-translate-y-0.5 disabled:opacity-50"
      >
        {pending ? 'Odosielam…' : 'Poslať odkaz'}
      </button>
    </form>
  )
}
