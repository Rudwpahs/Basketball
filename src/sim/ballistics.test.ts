import { describe, expect, it } from 'vitest'
import { COURT } from './court'
import { sampleBallisticArc, solveBallisticArc } from './ballistics'

describe('ballistic trajectory solver', () => {
  it('creates a non-flat arc that reaches the target', () => {
    const solution = solveBallisticArc({
      origin: { x: 4.2, y: 8.2, z: 2.15 },
      target: COURT.rim,
      launchAngleDeg: 52,
    })
    const points = sampleBallisticArc(solution, 61)

    expect(Math.max(...points.map((point) => point.z))).toBeGreaterThan(4)
    expect(points[20].z).toBeGreaterThan(points[0].z)
    expect(points.at(-1)!.x).toBeCloseTo(COURT.rim.x, 8)
    expect(points.at(-1)!.y).toBeCloseTo(COURT.rim.y, 8)
    expect(points.at(-1)!.z).toBeCloseTo(COURT.rim.z, 8)
  })

  it('rejects an angle that cannot reach the requested target', () => {
    expect(() =>
      solveBallisticArc({
        origin: { x: 0, y: 2, z: 1 },
        target: { x: 0, y: 10, z: 20 },
        launchAngleDeg: 20,
      }),
    ).toThrow(/cannot reach/i)
  })
})
