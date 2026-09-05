import { config } from 'dotenv'

config({ path: '.env.local' })
config()

async function main() {
  const [name] = process.argv.slice(2)
  const { createAdminClient } = await import('@/lib/db/supabase')
  const { runImport } = await import('./lib/run')
  const { mlh } = await import('./mlh')
  const { hackclub } = await import('./hackclub')

  const importers = { mlh, hackclub }

  if (!name || !(name in importers)) {
    console.error(`usage: npm run import -- <${Object.keys(importers).join('|')}>`)
    process.exit(1)
  }

  const summary = await runImport(
    createAdminClient(),
    importers[name as keyof typeof importers]
  )

  console.log(
    `${name}: ${summary.found} found, ${summary.inserted} inserted, ` +
      `${summary.updated} updated, ${summary.merged} merged, ${summary.skipped} skipped, ` +
      `${summary.errors.length} errors`
  )
  for (const error of summary.errors.slice(0, 10)) {
    console.warn(`  [${error.stage}] ${error.source_id ?? '-'}: ${error.message}`)
  }

  if (summary.errors.some((error) => error.stage === 'fetch')) process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
