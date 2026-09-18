import { afterEach, describe, expect, it, vi } from 'vitest'
import { isAdminEmail } from '@/lib/auth/admin'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('isAdminEmail', () => {
  it('denies everyone when ADMIN_EMAILS is unset or empty', () => {
    vi.stubEnv('ADMIN_EMAILS', undefined)
    expect(isAdminEmail('anyone@example.com')).toBe(false)
    expect(isAdminEmail('')).toBe(false)

    vi.stubEnv('ADMIN_EMAILS', '')
    expect(isAdminEmail('anyone@example.com')).toBe(false)
    expect(isAdminEmail('')).toBe(false)

    vi.stubEnv('ADMIN_EMAILS', ' , ,')
    expect(isAdminEmail('')).toBe(false)
  })

  it('denies a missing email', () => {
    vi.stubEnv('ADMIN_EMAILS', 'admin@example.com')
    expect(isAdminEmail(null)).toBe(false)
    expect(isAdminEmail(undefined)).toBe(false)
  })

  it('ignores case on both sides', () => {
    vi.stubEnv('ADMIN_EMAILS', 'Admin@Example.com')
    expect(isAdminEmail('admin@example.COM')).toBe(true)
  })

  it('ignores whitespace around entries', () => {
    vi.stubEnv('ADMIN_EMAILS', ' first@example.com , second@example.com ')
    expect(isAdminEmail('first@example.com')).toBe(true)
    expect(isAdminEmail('second@example.com')).toBe(true)
  })

  it('denies an address that is not listed', () => {
    vi.stubEnv('ADMIN_EMAILS', 'admin@example.com')
    expect(isAdminEmail('admin@example.com.evil.test')).toBe(false)
    expect(isAdminEmail('other@example.com')).toBe(false)
  })
})
