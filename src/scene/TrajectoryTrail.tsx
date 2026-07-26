import { Line } from '@react-three/drei'
import { toRenderPosition } from '../sim/coordinates'
import type { Point3 } from '../sim/types'

type TrajectoryTrailProps = Readonly<{
  points?: readonly Point3[]
}>

export function TrajectoryTrail({ points }: TrajectoryTrailProps) {
  if (!points || points.length < 2) {
    return null
  }

  return (
    <Line
      points={points.map(toRenderPosition)}
      color="#f4c95d"
      transparent
      opacity={0.68}
      lineWidth={1.2}
      dashed
      dashSize={0.18}
      gapSize={0.12}
    />
  )
}
