import type { Point3 } from './types'

export const GRAVITY = 9.81

type Velocity3 = Readonly<{
  x: number
  y: number
  z: number
}>

export type BallisticSolution = Readonly<{
  origin: Point3
  target: Point3
  velocity: Velocity3
  duration: number
  gravity: number
}>

type BallisticInput = Readonly<{
  origin: Point3
  target: Point3
  launchAngleDeg: number
  gravity?: number
}>

export function solveBallisticArc({
  origin,
  target,
  launchAngleDeg,
  gravity = GRAVITY,
}: BallisticInput): BallisticSolution {
  if (launchAngleDeg <= 0 || launchAngleDeg >= 90) {
    throw new RangeError('launchAngleDeg must be between 0 and 90')
  }
  if (gravity <= 0) {
    throw new RangeError('gravity must be positive')
  }

  const dx = target.x - origin.x
  const dy = target.y - origin.y
  const horizontalDistance = Math.hypot(dx, dy)

  if (horizontalDistance === 0) {
    throw new RangeError('origin and target need horizontal separation')
  }

  const angle = (launchAngleDeg * Math.PI) / 180
  const cos = Math.cos(angle)
  const heightDelta = target.z - origin.z
  const denominator =
    2 *
    cos ** 2 *
    (horizontalDistance * Math.tan(angle) - heightDelta)

  if (denominator <= 0) {
    throw new RangeError('Selected launch angle cannot reach the target')
  }

  const speedSquared =
    (gravity * horizontalDistance ** 2) / denominator

  if (!Number.isFinite(speedSquared) || speedSquared <= 0) {
    throw new RangeError('Selected launch angle cannot reach the target')
  }

  const speed = Math.sqrt(speedSquared)
  const horizontalSpeed = speed * cos
  const directionX = dx / horizontalDistance
  const directionY = dy / horizontalDistance

  return {
    origin,
    target,
    velocity: {
      x: directionX * horizontalSpeed,
      y: directionY * horizontalSpeed,
      z: speed * Math.sin(angle),
    },
    duration: horizontalDistance / horizontalSpeed,
    gravity,
  }
}

export function positionAtTime(
  solution: BallisticSolution,
  time: number,
): Point3 {
  return {
    x: solution.origin.x + solution.velocity.x * time,
    y: solution.origin.y + solution.velocity.y * time,
    z:
      solution.origin.z +
      solution.velocity.z * time -
      0.5 * solution.gravity * time ** 2,
  }
}

export function velocityAtTime(
  solution: BallisticSolution,
  time: number,
): Velocity3 {
  return {
    x: solution.velocity.x,
    y: solution.velocity.y,
    z: solution.velocity.z - solution.gravity * time,
  }
}

export function sampleBallisticArc(
  solution: BallisticSolution,
  sampleCount = 61,
): Point3[] {
  if (!Number.isInteger(sampleCount) || sampleCount < 2) {
    throw new RangeError('sampleCount must be an integer of at least 2')
  }

  return Array.from({ length: sampleCount }, (_, index) =>
    positionAtTime(
      solution,
      solution.duration * (index / (sampleCount - 1)),
    ),
  )
}

export function landingTime(
  solution: BallisticSolution,
  landingHeight: number,
): number {
  const discriminant =
    solution.velocity.z ** 2 +
    2 * solution.gravity * (solution.origin.z - landingHeight)

  if (discriminant < 0) {
    throw new RangeError('Trajectory never reaches the landing height')
  }

  return (
    (solution.velocity.z + Math.sqrt(discriminant)) / solution.gravity
  )
}
