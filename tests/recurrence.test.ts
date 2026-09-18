import { describe, expect, it } from 'vitest'
import {
  needsNextEdition,
  nextEdition,
  type RollCandidate,
} from '@/lib/hackathons/recurrence'

describe('nextEdition', () => {
  it('keeps the weekday of a weekend event', () => {
    const next = nextEdition({
      name: 'Hack Kosice',
      start_at: '2026-04-18T09:00:00Z',
      end_at: '2026-04-19T18:00:00Z',
    })

    expect(new Date('2026-04-18T09:00:00Z').getUTCDay()).toBe(6)
    expect(new Date(next.start_at).getUTCDay()).toBe(6)
    expect(new Date(next.end_at).getUTCDay()).toBe(0)
    expect(next.start_at).toBe('2027-04-17T09:00:00.000Z')
  })

  it('rolls a December event into the next year', () => {
    const next = nextEdition({
      name: 'Adventný hack',
      start_at: '2026-12-12T09:00:00Z',
      end_at: '2026-12-13T18:00:00Z',
    })

    expect(next.start_at).toBe('2027-12-11T09:00:00.000Z')
    expect(next.end_at).toBe('2027-12-12T18:00:00.000Z')
  })

  it('shifts the registration deadline the same way', () => {
    const next = nextEdition({
      name: 'Climathon',
      start_at: '2026-10-23T09:00:00Z',
      end_at: '2026-10-25T18:00:00Z',
      registration_deadline: '2026-10-01T23:59:00Z',
    })

    expect(next.registration_deadline).toBe('2027-09-30T23:59:00.000Z')
  })

  it('leaves the deadline empty when there is none', () => {
    const next = nextEdition({
      name: 'Climathon',
      start_at: '2026-10-23T09:00:00Z',
      end_at: '2026-10-25T18:00:00Z',
      registration_deadline: null,
    })

    expect(next.registration_deadline).toBeNull()
  })

  it('replaces a trailing year with the year of the new start', () => {
    const next = nextEdition({
      name: 'HackYeah 2026',
      start_at: '2026-10-03T08:30:00Z',
      end_at: '2026-10-04T17:45:00Z',
    })

    expect(next.name).toBe('HackYeah 2027')
  })

  it('leaves a name without a trailing year alone', () => {
    expect(
      nextEdition({
        name: 'Rakathon 2026 (Praha)',
        start_at: '2026-10-16T09:30:00Z',
        end_at: '2026-10-18T18:00:00Z',
      }).name
    ).toBe('Rakathon 2026 (Praha)')

    expect(
      nextEdition({
        name: 'Hack Kosice',
        start_at: '2026-04-18T09:00:00Z',
        end_at: '2026-04-19T18:00:00Z',
      }).name
    ).toBe('Hack Kosice')
  })
})

describe('needsNextEdition', () => {
  const now = new Date('2026-09-18T12:00:00Z')
  const ended: RollCandidate = {
    status: 'published',
    recurrence: 'annual',
    end_at: '2026-09-01T18:00:00Z',
  }

  it('rolls an ended annual event that has no child', () => {
    expect(needsNextEdition(ended, false, now)).toBe(true)
  })

  it('rolls a cancelled edition too: the series is still annual', () => {
    expect(needsNextEdition({ ...ended, status: 'cancelled' }, false, now)).toBe(true)
  })

  it('skips an event that already has a child', () => {
    expect(needsNextEdition(ended, true, now)).toBe(false)
  })

  it('skips an event that has not ended yet', () => {
    expect(
      needsNextEdition({ ...ended, end_at: '2026-10-01T18:00:00Z' }, false, now)
    ).toBe(false)
  })

  it('skips a one-off event', () => {
    expect(needsNextEdition({ ...ended, recurrence: 'none' }, false, now)).toBe(false)
  })

  it('skips rejected and pending rows', () => {
    expect(needsNextEdition({ ...ended, status: 'rejected' }, false, now)).toBe(false)
    expect(needsNextEdition({ ...ended, status: 'pending' }, false, now)).toBe(false)
  })
})
