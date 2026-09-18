import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/db/supabase'

/** Thrown when a signed-in user is not on the allowlist. */
export class NotAdminError extends Error {
  constructor() {
    super('Forbidden')
    this.name = 'NotAdminError'
  }
}

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return adminEmails().includes(email.toLowerCase())
}

/**
 * The signed-in user's email, or null. Reads `getUser()`, which verifies the
 * token with the auth server; `getSession()` would trust a cookie the browser
 * sent us.
 */
export async function viewerEmail(): Promise<string | null> {
  const db = await createServerSupabaseClient()
  const { data, error } = await db.auth.getUser()
  if (error) return null
  return data.user?.email ?? null
}

export async function isViewerAdmin(): Promise<boolean> {
  return isAdminEmail(await viewerEmail())
}

/**
 * The authorization boundary. Every admin page, admin data read and server
 * action starts here; the proxy only decides who gets a login page, it never
 * decides who is an admin.
 */
export async function requireAdmin(): Promise<string> {
  const email = await viewerEmail()
  if (!email) redirect('/admin/login')
  if (!isAdminEmail(email)) throw new NotAdminError()
  return email
}
