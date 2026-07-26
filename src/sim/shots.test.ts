import { describe, expect, it } from 'vitest'
import { COURT } from './court'
import { createShotPath } from './shots'
import { inspectShotPath } from './collisions'

const origin = { x: 3.8, y: 8, z: 2.1 }

describe('semantic shot trajectories', () => {
  it('sends a swish through the clear centre of the rim', () => {
    const shot = createShotPath({ origin, outcome: 'swish' })
    const inspection = inspectShotPath(shot)
    const crossing = shot.events.find((event) => event.type === 'rim-crossing')

    expect(crossing).toBeDefined()
    expect(crossing!.position.x).toBeCloseTo(COURT.rim.x, 8)
    expect(crossing!.position.y).toBeCloseTo(COURT.rim.y, 8)
    expect(crossing!.position.z).toBeCloseTo(COURT.rim.z, 8)
    expect(inspection.rimContacts).toHaveLength(0)
    expect(shot.events.map((event) => event.type)).toEqual([
      'release',
      'rim-crossing',
      'made',
    ])
  })

  it('keeps an airball clear of both rim and backboard', () => {
    const shot = createShotPath({ origin, outcome: 'airball' })
    const inspection = inspectShotPath(shot)

    expect(inspection.rimContacts).toHaveLength(0)
    expect(inspection.backboardContacts).toHaveLength(0)
    expect(inspection.minimumRimClearance).toBeGreaterThan(0.2)
    expect(shot.events.map((event) => event.type)).toEqual([
      'release',
      'miss',
      'landing',
    ])
  })

  it.each([
    ['front-rim', 'front'],
    ['back-rim', 'back'],
  ] as const)('records the correct first contact for %s', (outcome, side) => {
    const shot = createShotPath({ origin, outcome })
    const inspection = inspectShotPath(shot)

    expect(inspection.rimContacts[0]?.side).toBe(side)
    expect(shot.events[1].type).toBe(`${side}-rim-contact`)
    expect(shot.events.at(-1)?.type).toBe('miss')
  })

  it('records visible rim contact before a rim-out miss', () => {
    const shot = createShotPath({ origin, outcome: 'rim-out' })
    const inspection = inspectShotPath(shot)

    expect(inspection.rimContacts.length).toBeGreaterThan(0)
    expect(shot.events.some((event) => event.type.endsWith('rim-contact'))).toBe(
      true,
    )
    expect(shot.events.at(-1)?.type).toBe('miss')
  })

  it('records backboard contact before a bank make', () => {
    const shot = createShotPath({ origin, outcome: 'bank-make' })
    const inspection = inspectShotPath(shot)

    expect(inspection.backboardContacts).toHaveLength(1)
    expect(inspection.rimContacts).toHaveLength(0)
    expect(shot.events.map((event) => event.type)).toEqual([
      'release',
      'backboard-contact',
      'rim-crossing',
      'made',
    ])
  })

  it('gives every shot visible height, not a flat screen translation', () => {
    for (const outcome of [
      'swish',
      'airball',
      'front-rim',
      'back-rim',
      'rim-out',
      'bank-make',
    ] as const) {
      const shot = createShotPath({ origin, outcome })
      const heights = shot.points.map((point) => point.z)

      expect(Math.max(...heights) - Math.min(...heights)).toBeGreaterThan(1)
    }
  })
})
