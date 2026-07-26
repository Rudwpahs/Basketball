import { Line } from '@react-three/drei'
import {
  COURT,
  getCornerThreeSegments,
  getRestrictedAreaArc,
  getThreePointArc,
} from '../sim/court'
import { toRenderPosition } from '../sim/coordinates'
import type { Point3 } from '../sim/types'
import type { CourtHighlight } from '../sim/scenario'

type CourtMarkingsProps = Readonly<{
  highlight?: CourtHighlight
}>

function circle(
  centerX: number,
  centerY: number,
  radius: number,
  sampleCount = 64,
): Point3[] {
  return Array.from({ length: sampleCount + 1 }, (_, index) => {
    const angle = (index / sampleCount) * Math.PI * 2
    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      z: COURT.floorLineZ,
    }
  })
}

const boundary = [
  { x: -COURT.halfWidth, y: 0, z: COURT.floorLineZ },
  {
    x: COURT.halfWidth,
    y: 0,
    z: COURT.floorLineZ,
  },
  {
    x: COURT.halfWidth,
    y: COURT.halfLength,
    z: COURT.floorLineZ,
  },
  {
    x: -COURT.halfWidth,
    y: COURT.halfLength,
    z: COURT.floorLineZ,
  },
  { x: -COURT.halfWidth, y: 0, z: COURT.floorLineZ },
] satisfies Point3[]

const lane = [
  { x: -COURT.laneHalfWidth, y: 0, z: COURT.floorLineZ },
  {
    x: -COURT.laneHalfWidth,
    y: COURT.freeThrowY,
    z: COURT.floorLineZ,
  },
  {
    x: COURT.laneHalfWidth,
    y: COURT.freeThrowY,
    z: COURT.floorLineZ,
  },
  { x: COURT.laneHalfWidth, y: 0, z: COURT.floorLineZ },
] satisfies Point3[]

const cornerSegments = getCornerThreeSegments()
const cornerPoints = [
  cornerSegments.left.start,
  cornerSegments.left.end,
  ...getThreePointArc(),
  cornerSegments.right.end,
  cornerSegments.right.start,
]

export function CourtMarkings({ highlight }: CourtMarkingsProps) {
  const threeColour =
    highlight === 'three-point-line' ? '#e34b32' : '#f7f1e7'
  const standardLine = '#f7f1e7'

  return (
    <group>
      <Line
        points={boundary.map(toRenderPosition)}
        color={standardLine}
        lineWidth={1.4}
      />
      <Line
        points={lane.map(toRenderPosition)}
        color={standardLine}
        lineWidth={1.15}
      />
      <Line
        points={circle(
          0,
          COURT.freeThrowY,
          COURT.freeThrowRadius,
        ).map(toRenderPosition)}
        color={standardLine}
        lineWidth={1.05}
      />
      <Line
        points={cornerPoints.map(toRenderPosition)}
        color={threeColour}
        lineWidth={highlight === 'three-point-line' ? 2.5 : 1.35}
      />
      <Line
        points={getRestrictedAreaArc().map(toRenderPosition)}
        color={
          highlight === 'restricted-area' ? '#e34b32' : standardLine
        }
        lineWidth={highlight === 'restricted-area' ? 2.5 : 1.05}
      />
      <Line
        points={[
          toRenderPosition({
            x: -COURT.halfWidth,
            y: COURT.halfLength,
            z: COURT.floorLineZ,
          }),
          toRenderPosition({
            x: COURT.halfWidth,
            y: COURT.halfLength,
            z: COURT.floorLineZ,
          }),
        ]}
        color={standardLine}
        lineWidth={1.4}
      />
    </group>
  )
}
