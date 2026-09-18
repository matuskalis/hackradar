import type { Metadata } from 'next'
import { LoginForm } from '@/components/admin/LoginForm'

export const metadata: Metadata = {
  title: 'Prihlásenie',
  robots: { index: false, follow: false },
}

const ERRORS: Record<string, string> = {
  'chyba-odkazu': 'Odkaz bol neúplný. Vyžiadajte si nový.',
  'odkaz-vyprsal': 'Odkaz už neplatí alebo bol použitý. Vyžiadajte si nový.',
}

export default async function LoginPage({ searchParams }: PageProps<'/admin/login'>) {
  const { error } = await searchParams
  const message = typeof error === 'string' ? ERRORS[error] : undefined

  return (
    <main className="mx-auto w-full max-w-md px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Administrácia</h1>
      <p className="mt-3 text-sm text-muted">
        Zadajte e-mail. Pošleme vám jednorazový prihlasovací odkaz.
      </p>

      {message && (
        <p className="mt-6 border-l-4 border-accent bg-ink p-3 text-sm text-ground">
          {message}
        </p>
      )}

      <div className="mt-8">
        <LoginForm />
      </div>
    </main>
  )
}
