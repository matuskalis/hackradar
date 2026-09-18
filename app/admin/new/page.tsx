import type { Metadata } from 'next'
import Link from 'next/link'
import { NewHackathonFlow } from '@/components/admin/NewHackathonFlow'
import { requireAdmin } from '@/lib/auth/admin'

export const metadata: Metadata = {
  title: 'Pridať z URL',
  robots: { index: false, follow: false },
}

export default async function NewHackathonPage() {
  await requireAdmin()

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link href="/admin" className="label underline underline-offset-4">
        Späť na zoznam
      </Link>

      <h1 className="mt-4 text-3xl font-bold tracking-tight">Pridať z URL</h1>
      <p className="mt-2 text-sm text-muted">
        Vložte odkaz na stránku hackathonu. Údaje sa prečítajú zo stránky, chýbajúce
        polia doplníte sami.
      </p>

      <div className="mt-8">
        <NewHackathonFlow />
      </div>
    </main>
  )
}
