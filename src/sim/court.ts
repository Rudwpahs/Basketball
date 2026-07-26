import type { Point3, Segment3 } from './types'

export const COURT = {
  halfLength: 14.3256,
  halfWidth: 7.62,
  lineWidth: 0.0508,
  floorLineZ: 0.012,
  rim: { x: 0, y: 1.6002, z: 3.048 },
  rimInnerRadius: 0.2286,
  rimTubeRadius: 0.0105,
  ballRadius: 0.1194,
  threePointRadius: 7.239,
  cornerThreeX: 6.7056,
  backboardY: 1.2192,
  backboardWidth: 1.8288,
  backboardHeight: 1.0668,
  backboardBottomZ: 2.8956,
  freeThrowY: 5.7912,
  laneHalfWidth: 2.4384,
  freeThrowRadius: 1.8288,
  restrictedRadius: 1.2192,
} as const

function assertSampleCount(sampleCount: number): void {
  if (!Number.isInteger(sampleCount) || sampleCount < 2) {
    throw new RangeError('sampleCount must be an integer of at least 2')
  }
}

export function getThreePointArc(sampleCount = 65): Point3[] {
  assertSampleCount(sampleCount)
  const angleLimit = Math.asin(
    COURT.cornerThreeX / COURT.threePointRadius,
  )

  return Array.from({ length: sampleCount }, (_, index) => {
    const progress = index / (sampleCount - 1)
    const angle = -angleLimit + progress * angleLimit * 2

    return {
      x: COURT.threePointRadius * Math.sin(angle),
      y: COURT.rim.y + COURT.threePointRadius * Math.cos(angle),
      z: COURT.floorLineZ,
    }
  })
}

export function getCornerThreeSegments(): Readonly<{
  left: Segment3
  right: Segment3
}> {
  const yOffset = Math.sqrt(
    COURT.threePointRadius ** 2 - COURT.cornerThreeX ** 2,
  )
  const endY = COURT.rim.y + yOffset

  return {
    left: {
      start: { x: -COURT.cornerThreeX, y: 0, z: COURT.floorLineZ },
      end: {
        x: -COURT.cornerThreeX,
        y: endY,
        z: COURT.floorLineZ,
      },
    },
    right: {
      start: { x: COURT.cornerThreeX, y: 0, z: COURT.floorLineZ },
      end: {
        x: COURT.cornerThreeX,
        y: endY,
        z: COURT.floorLineZ,
      },
    },
  }
}

export function getRestrictedAreaArc(sampleCount = 33): Point3[] {
  assertSampleCount(sampleCount)

  return Array.from({ length: sampleCount }, (_, index) => {
    const progress = index / (sampleCount - 1)
    const angle = -Math.PI / 2 + progress * Math.PI

    return {
      x: COURT.restrictedRadius * Math.sin(angle),
      y: COURT.rim.y + COURT.restrictedRadius * Math.cos(angle),
      z: 0.013,
    }
  })
}
