import type { Metadata } from 'next'
import Link from 'next/link'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ variable: '--font-inter', subsets: ['latin', 'latin-ext'] })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'HackRadar — hackathony vo vašom okolí',
    template: '%s | HackRadar',
  },
  description:
    'Mapa hackathonov v strednej Európe. Nájdite hackathony vo svojom okolí podľa polohy, termínu a témy.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="sk" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white text-stone-900">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-stone-200 px-4">
          <Link href="/" className="font-semibold tracking-tight">
            Hack<span className="text-orange-600">Radar</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-stone-600">
            <Link href="/pridat" className="hover:text-stone-900">
              Pridať hackathon
            </Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  )
}
