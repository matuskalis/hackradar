import { lookup } from 'node:dns/promises'

const TIMEOUT_MS = 8_000
const MAX_BYTES = 2 * 1024 * 1024
const MAX_REDIRECTS = 3
const USER_AGENT = 'HackRadar/0.1'

export type FetchedPage = { html: string; finalUrl: string }

function parseIPv4(ip: string): number[] | null {
  const parts = ip.split('.')
  if (parts.length !== 4) return null
  const bytes: number[] = []
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null
    const value = Number(part)
    if (value > 255) return null
    bytes.push(value)
  }
  return bytes
}

function parseIPv6(ip: string): number[] | null {
  const address = ip.split('%')[0].replace(/^\[|\]$/g, '')
  if (!address.includes(':')) return null

  const [head, tail, ...rest] = address.split('::')
  if (rest.length > 0) return null

  const toGroups = (section: string): number[][] | null => {
    if (section === '') return []
    const groups: number[][] = []
    const parts = section.split(':')
    for (const [index, part] of parts.entries()) {
      if (index === parts.length - 1 && part.includes('.')) {
        const v4 = parseIPv4(part)
        if (!v4) return null
        groups.push([v4[0], v4[1]], [v4[2], v4[3]])
        continue
      }
      if (!/^[0-9a-f]{1,4}$/i.test(part)) return null
      const value = parseInt(part, 16)
      groups.push([value >> 8, value & 0xff])
    }
    return groups
  }

  const headGroups = toGroups(head)
  const tailGroups = tail === undefined ? [] : toGroups(tail)
  if (!headGroups || !tailGroups) return null

  if (tail === undefined) {
    if (headGroups.length !== 8) return null
    return headGroups.flat()
  }
  const fill = 8 - headGroups.length - tailGroups.length
  if (fill < 0) return null
  return [...headGroups, ...Array.from({ length: fill }, () => [0, 0]), ...tailGroups].flat()
}

/**
 * True for anything an attacker could point a submitted URL at inside our own
 * network: loopback, RFC1918, link-local (which covers cloud metadata),
 * unique-local IPv6 and the unspecified address. Unparseable input is blocked.
 */
export function isBlockedAddress(ip: string): boolean {
  const v4 = parseIPv4(ip.trim())
  if (v4) {
    const [a, b] = v4
    if (a === 0) return true
    if (a === 10) return true
    if (a === 127) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    return false
  }

  const v6 = parseIPv6(ip.trim())
  if (!v6) return true

  const isMappedV4 =
    v6.slice(0, 10).every((byte) => byte === 0) && v6[10] === 0xff && v6[11] === 0xff
  if (isMappedV4) return isBlockedAddress(v6.slice(12).join('.'))

  if (v6.every((byte) => byte === 0)) return true
  if (v6.slice(0, 15).every((byte) => byte === 0) && v6[15] === 1) return true
  if ((v6[0] & 0xfe) === 0xfc) return true
  if (v6[0] === 0xfe && (v6[1] & 0xc0) === 0x80) return true
  return false
}

async function assertPublicHost(hostname: string): Promise<void> {
  const literal = hostname.replace(/^\[|\]$/g, '')
  if (parseIPv4(literal) || parseIPv6(literal)) {
    if (isBlockedAddress(literal)) throw new Error(`refused: ${hostname} is a private address`)
    return
  }

  let addresses: { address: string }[]
  try {
    addresses = await lookup(hostname, { all: true })
  } catch {
    throw new Error(`refused: cannot resolve ${hostname}`)
  }
  if (addresses.length === 0) throw new Error(`refused: cannot resolve ${hostname}`)
  for (const { address } of addresses) {
    if (isBlockedAddress(address)) throw new Error(`refused: ${hostname} resolves to a private address`)
  }
}

function assertHttpUrl(raw: string): URL {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error(`refused: ${raw} is not a valid URL`)
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`refused: only http and https are allowed, got ${url.protocol}`)
  }
  return url
}

async function readCappedBody(response: Response): Promise<Uint8Array> {
  const declared = Number(response.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > MAX_BYTES) {
    throw new Error('refused: page is larger than 2 MB')
  }

  const body = response.body
  if (!body) return new Uint8Array()

  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_BYTES) throw new Error('refused: page is larger than 2 MB')
      chunks.push(value)
    }
  } finally {
    await reader.cancel().catch(() => {})
  }

  const merged = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }
  return merged
}

function decodeBody(bytes: Uint8Array, contentType: string): string {
  const charset = /charset=["']?([\w-]+)/i.exec(contentType)?.[1]
  try {
    return new TextDecoder(charset ?? 'utf-8').decode(bytes)
  } catch {
    return new TextDecoder('utf-8').decode(bytes)
  }
}

/**
 * Fetches a page for the add-by-URL importer. The URL comes from an admin form
 * but points anywhere, so every hop is re-checked against the IP guard and the
 * redirect chain is followed by hand rather than by the fetch implementation.
 */
export async function fetchPage(url: string): Promise<FetchedPage> {
  const signal = AbortSignal.timeout(TIMEOUT_MS)
  let target = assertHttpUrl(url)

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    await assertPublicHost(target.hostname)

    const response = await fetch(target, {
      redirect: 'manual',
      signal,
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
    })

    const location = response.headers.get('location')
    if (response.status >= 300 && response.status < 400 && location) {
      target = assertHttpUrl(new URL(location, target).toString())
      continue
    }

    if (!response.ok) {
      throw new Error(`fetch failed: ${response.status} for ${target.toString()}`)
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.toLowerCase().includes('text/html')) {
      throw new Error(`refused: expected text/html, got "${contentType || 'nothing'}"`)
    }

    const bytes = await readCappedBody(response)
    return { html: decodeBody(bytes, contentType), finalUrl: target.toString() }
  }

  throw new Error(`refused: more than ${MAX_REDIRECTS} redirects`)
}
