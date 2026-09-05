import type { Metadata } from 'next'
import { SubmitForm } from '@/components/submit/SubmitForm'

export const metadata: Metadata = {
  title: 'Pridať hackathon',
  description:
    'Organizujete hackathon v strednej Európe? Pridajte ho na mapu. Po schválení sa zobrazí zadarmo.',
}

export default function SubmitPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Pridať hackathon</h1>
      <p className="mt-2 text-stone-600">
        Vyplňte, čo o podujatí viete. Pozrieme si to a po schválení sa objaví na mape.
        Zverejnenie je zadarmo.
      </p>
      <div className="mt-8">
        <SubmitForm />
      </div>
    </main>
  )
}
