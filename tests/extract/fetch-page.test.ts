import { describe, expect, it } from 'vitest'
import { isBlockedAddress } from '@/lib/extract/fetch-page'

describe('isBlockedAddress', () => {
  it('blocks IPv4 loopback, private, link-local and unspecified ranges', () => {
    expect(isBlockedAddress('127.0.0.1')).toBe(true)
    expect(isBlockedAddress('10.1.2.3')).toBe(true)
    expect(isBlockedAddress('172.20.0.1')).toBe(true)
    expect(isBlockedAddress('192.168.1.1')).toBe(true)
    expect(isBlockedAddress('169.254.169.254')).toBe(true)
    expect(isBlockedAddress('0.0.0.0')).toBe(true)
  })

  it('blocks IPv6 loopback, unique-local and link-local ranges', () => {
    expect(isBlockedAddress('::1')).toBe(true)
    expect(isBlockedAddress('fc00::1')).toBe(true)
    expect(isBlockedAddress('fd12:3456::1')).toBe(true)
    expect(isBlockedAddress('fe80::1')).toBe(true)
    expect(isBlockedAddress('::')).toBe(true)
    expect(isBlockedAddress('::ffff:169.254.169.254')).toBe(true)
  })

  it('allows public addresses', () => {
    expect(isBlockedAddress('1.1.1.1')).toBe(false)
    expect(isBlockedAddress('172.32.0.1')).toBe(false)
    expect(isBlockedAddress('2606:4700:4700::1111')).toBe(false)
  })

  it('blocks anything it cannot parse', () => {
    expect(isBlockedAddress('not-an-ip')).toBe(true)
    expect(isBlockedAddress('999.1.1.1')).toBe(true)
    expect(isBlockedAddress('')).toBe(true)
  })
})
