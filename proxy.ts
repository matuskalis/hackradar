import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const LOGIN_PATH = '/admin/login'

function allowlist(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * Refreshes the Supabase session cookie and keeps anonymous visitors out of the
 * admin. Authorization itself stays in `requireAdmin()`: every admin page and
 * server action checks the allowlist again, because a proxy can be bypassed by
 * a request that never passes through it.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isGuardedAdminPath = pathname.startsWith('/admin') && pathname !== LOGIN_PATH
  if (!isGuardedAdminPath) return response

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = LOGIN_PATH
    url.search = ''
    return NextResponse.redirect(url)
  }

  // A signed-in visitor who is not an admin gets a real 403 rather than a
  // redirect loop. The pages refuse them again on their own.
  if (!allowlist().includes((user.email ?? '').toLowerCase())) {
    return new NextResponse('403 — tento účet nemá prístup do administrácie.', {
      status: 403,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/auth/:path*'],
}
