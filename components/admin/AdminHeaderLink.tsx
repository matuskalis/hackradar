'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

/**
 * Shows the admin link to admins only. The check runs in the browser: reading
 * the session cookie on the server would make every public page dynamic. A
 * visitor with no Supabase cookie never sends the request at all.
 */
export function AdminHeaderLink() {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!document.cookie.includes('-auth-token')) return

    let current = true
    fetch('/api/admin/session', { cache: 'no-store' })
      .then((response) => response.json() as Promise<{ admin?: boolean }>)
      .then((data) => {
        if (current) setIsAdmin(Boolean(data.admin))
      })
      .catch(() => {})

    return () => {
      current = false
    }
  }, [])

  if (!isAdmin) return null

  return (
    <Link
      href="/admin"
      className="border border-bar-ink/40 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:border-accent hover:bg-accent"
    >
      Administrácia
    </Link>
  )
}
