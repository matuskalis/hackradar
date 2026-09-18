import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase'

/**
 * Where the magic link lands. The link carries a PKCE code; the verifier sits
 * in a cookie this server wrote when the link was requested, so the exchange
 * only works in the browser that asked for it.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const origin = request.nextUrl.origin

  if (!code) {
    return NextResponse.redirect(`${origin}/admin/login?error=chyba-odkazu`)
  }

  const supabase = await createServerSupabaseClient()
  const flowId = request.nextUrl.searchParams.get('sb_flow_id')
  const { error } = await supabase.auth.exchangeCodeForSession(
    code,
    flowId ? { flowId } : undefined
  )

  if (error) {
    console.error('auth callback failed', error.message)
    return NextResponse.redirect(`${origin}/admin/login?error=odkaz-vyprsal`)
  }

  return NextResponse.redirect(`${origin}/admin`)
}
