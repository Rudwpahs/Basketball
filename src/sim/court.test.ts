import { describe, expect, it } from 'vitest'
import { toRenderPosition } from './coordinates'
import {
  COURT,
  getCornerThreeSegments,
  getRestrictedAreaArc,
  getThreePointArc,
} from './court'

describe('official NBA half-court geometry', () => {
  it('uses literal NBA dimensions in metres', () => {
    expect(COURT.halfLength).toBe(14.3256)
    expect(COURT.halfWidth).toBe(7.62)
    expect(COURT.rim).toEqual({ x: 0, y: 1.6002, z: 3.048 })
    expect(COURT.rimInnerRadius).toBe(0.2286)
    expect(COURT.threePointRadius).toBe(7.239)
    expect(COURT.cornerThreeX).toBe(6.7056)
    expect(COURT.backboardY).toBe(1.2192)
  })

  it('places the three-point arc entirely on the midcourt side of the rim', () => {
    const arc = getThreePointArc(65)

    expect(arc).toHaveLength(65)
    expect(arc[32].x).toBeCloseTo(0, 8)
    expect(arc[32].y).toBeCloseTo(
      COURT.rim.y + COURT.threePointRadius,
      8,
    )
    expect(Math.min(...arc.map((point) => point.y))).toBeGreaterThan(
      COURT.rim.y,
    )
  })

  it('joins the corner lines to both arc endpoints', () => {
    const arc = getThreePointArc(65)
    const corners = getCornerThreeSegments()

    expect(corners.left.start).toEqual({
      x: -COURT.cornerThreeX,
      y: 0,
      z: 0.012,
    })
    expect(corners.right.start).toEqual({
      x: COURT.cornerThreeX,
      y: 0,
      z: 0.012,
    })
    expect(corners.left.end.x).toBeCloseTo(arc[0].x, 8)
    expect(corners.left.end.y).toBeCloseTo(arc[0].y, 8)
    expect(corners.right.end.x).toBeCloseTo(arc.at(-1)!.x, 8)
    expect(corners.right.end.y).toBeCloseTo(arc.at(-1)!.y, 8)
  })

  it('draws the restricted arc away from the baseline', () => {
    const arc = getRestrictedAreaArc(33)

    expect(arc[16]).toEqual({
      x: 0,
      y: COURT.rim.y + COURT.restrictedRadius,
      z: 0.013,
    })
    expect(Math.min(...arc.map((point) => point.y))).toBeGreaterThanOrEqual(
      COURT.rim.y,
    )
  })

  it('maps world height to the renderer vertical axis exactly once', () => {
    expect(toRenderPosition({ x: 2, y: 5, z: 3 })).toEqual([2, 3, -5])
  })
})
