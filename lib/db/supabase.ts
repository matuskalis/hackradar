import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

// Read at call time, not module scope: scripts load .env.local after imports.
const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createClient() {
  return createBrowserClient<Database>(url(), anonKey())
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(url(), anonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Called from a Server Component, where cookies are read-only.
        }
      },
    },
  })
}

/**
 * Read-only client without cookies. Public pages use it so they can still be
 * statically generated; RLS limits it to published rows either way.
 */
export function createAnonClient() {
  return createSupabaseClient<Database>(url(), anonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function createAdminClient() {
  return createSupabaseClient<Database>(
    url(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
