import type { Metadata } from 'next'
import Link from 'next/link'
import { Archivo, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const archivo = Archivo({
  variable: '--font-archivo',
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
})

const mono = JetBrains_Mono({
  variable: '--font-mono-data',
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '700'],
})

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
    <html lang="sk" className={`${archivo.variable} ${mono.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-bar px-4 text-bar-ink">
          <Link
            href="/"
            className="text-lg font-bold uppercase tracking-[0.18em] focus-visible:outline-offset-4"
          >
            Hack<span className="text-accent">Radar</span>
          </Link>

          <nav>
            <Link
              href="/pridat"
              className="border border-bar-ink/40 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:bg-accent hover:border-accent"
            >
              Pridať hackathon
            </Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  )
}
