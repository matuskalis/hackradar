import { describe, expect, it } from 'vitest'
import { toJsonLdScript } from '@/lib/json-ld'

describe('toJsonLdScript', () => {
  it('does not let a value close the script tag', () => {
    const out = toJsonLdScript({
      name: 'Zlý Hackathon</script><img src=x onerror=alert(1)>',
    })
    expect(out).not.toContain('</script>')
    expect(out).not.toContain('<img')
  })

  it('escapes the characters that can start a tag, a comment or an entity', () => {
    const out = toJsonLdScript({ a: '<', b: '>', c: '&' })
    expect(out).toContain('\\u003c')
    expect(out).toContain('\\u003e')
    expect(out).toContain('\\u0026')
  })

  it('still parses back to the original value', () => {
    const value = { name: 'Hack <Košice> & spol.', nested: { url: 'https://x.sk?a=1&b=2' } }
    expect(JSON.parse(toJsonLdScript(value))).toEqual(value)
  })
})
