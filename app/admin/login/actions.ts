'use server'

import { z } from 'zod'
import { isAdminEmail } from '@/lib/auth/admin'
import { createServerSupabaseClient } from '@/lib/db/supabase'
import { checkRateLimit } from '@/lib/rate-limit/limiter'

export type LoginState = { error: string | null; sent: boolean }

const emailSchema = z.email().max(160)

/**
 * Sends a magic link. The answer is the same for every address, so the form
 * cannot be used to find out who the admins are.
 */
export async function sendMagicLink(
  _state: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = emailSchema.safeParse(formData.get('email'))
  if (!email.success) {
    return { error: 'Zadajte platnú e-mailovú adresu.', sent: false }
  }

  const verdict = await checkRateLimit(`login:${email.data.toLowerCase()}`, 5, 60 * 60_000)
  if (!verdict.ok) {
    return { error: 'Príliš veľa pokusov. Skúste to o hodinu.', sent: false }
  }

  if (!isAdminEmail(email.data)) {
    return { error: null, sent: true }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
      shouldCreateUser: true,
    },
  })

  if (error) {
    console.error('magic link failed', error.message)
    return { error: 'Odkaz sa nepodarilo odoslať. Skúste to znova.', sent: false }
  }

  return { error: null, sent: true }
}
