import {
  landingTime,
  positionAtTime,
  sampleBallisticArc,
  solveBallisticArc,
  velocityAtTime,
  type BallisticSolution,
} from './ballistics'
import { COURT } from './court'
import type { Point3 } from './types'

export type ShotOutcome =
  | 'swish'
  | 'airball'
  | 'front-rim'
  | 'back-rim'
  | 'rim-out'
  | 'bank-make'

export type ShotEventType =
  | 'release'
  | 'rim-crossing'
  | 'front-rim-contact'
  | 'back-rim-contact'
  | 'backboard-contact'
  | 'made'
  | 'miss'
  | 'landing'

export type ShotEvent = Readonly<{
  type: ShotEventType
  pointIndex: number
  position: Point3
}>

export type ShotPath = Readonly<{
  outcome: ShotOutcome
  points: readonly Point3[]
  events: readonly ShotEvent[]
  duration: number
}>

type ShotInput = Readonly<{
  origin: Point3
  outcome: ShotOutcome
}>

type Velocity3 = Readonly<{ x: number; y: number; z: number }>

function sampleTimeRange(
  solution: BallisticSolution,
  startTime: number,
  endTime: number,
  sampleCount: number,
): Point3[] {
  return Array.from({ length: sampleCount }, (_, index) => {
    const progress = index / (sampleCount - 1)
    return positionAtTime(
      solution,
      startTime + (endTime - startTime) * progress,
    )
  })
}

function event(
  type: ShotEventType,
  pointIndex: number,
  points: readonly Point3[],
): ShotEvent {
  return { type, pointIndex, position: points[pointIndex] }
}

function createThroughShot(
  origin: Point3,
  target: Point3,
  outcome: 'swish' | 'airball',
): ShotPath {
  const solution = solveBallisticArc({
    origin,
    target,
    launchAngleDeg: outcome === 'swish' ? 52 : 49,
  })
  const crossingIndex = 56
  const beforeCrossing = sampleBallisticArc(solution, crossingIndex + 1)
  const endTime = landingTime(solution, COURT.ballRadius)
  const afterCrossing = sampleTimeRange(
    solution,
    solution.duration,
    endTime,
    29,
  ).slice(1)
  const points = [...beforeCrossing, ...afterCrossing]

  if (outcome === 'swish') {
    return {
      outcome,
      points,
      events: [
        event('release', 0, points),
        event('rim-crossing', crossingIndex, points),
        event('made', crossingIndex + 4, points),
      ],
      duration: endTime,
    }
  }

  return {
    outcome,
    points,
    events: [
      event('release', 0, points),
      event('miss', crossingIndex, points),
      event('landing', points.length - 1, points),
    ],
    duration: endTime,
  }
}

function normalise(vector: Velocity3): Velocity3 {
  const length = Math.hypot(vector.x, vector.y, vector.z)
  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length,
  }
}

function reflect(
  velocity: Velocity3,
  normalInput: Velocity3,
  restitution: number,
): Velocity3 {
  const normal = normalise(normalInput)
  const dot =
    velocity.x * normal.x +
    velocity.y * normal.y +
    velocity.z * normal.z
  const impulse = (1 + restitution) * dot

  return {
    x: velocity.x - impulse * normal.x,
    y: velocity.y - impulse * normal.y,
    z: velocity.z - impulse * normal.z,
  }
}

function sampleFreeFlight(
  origin: Point3,
  velocity: Velocity3,
  duration: number,
  sampleCount: number,
): Point3[] {
  return Array.from({ length: sampleCount }, (_, index) => {
    const time = duration * (index / (sampleCount - 1))
    return {
      x: origin.x + velocity.x * time,
      y: origin.y + velocity.y * time,
      z: Math.max(
        COURT.ballRadius,
        origin.z + velocity.z * time - 0.5 * 9.81 * time ** 2,
      ),
    }
  })
}

function createRimContactShot(
  origin: Point3,
  side: 'front' | 'back',
  outcome: 'front-rim' | 'back-rim' | 'rim-out',
): ShotPath {
  const rimCenterlineRadius =
    COURT.rimInnerRadius + COURT.rimTubeRadius
  const contactRadius = COURT.ballRadius + COURT.rimTubeRadius
  const verticalOffset = 0.09
  const radialOffset = Math.sqrt(
    contactRadius ** 2 - verticalOffset ** 2,
  )
  const sideSign = side === 'front' ? 1 : -1
  const contact: Point3 = {
    x: 0,
    y:
      COURT.rim.y +
      sideSign * (rimCenterlineRadius + radialOffset),
    z: COURT.rim.z + verticalOffset,
  }
  const incoming = solveBallisticArc({
    origin,
    target: contact,
    launchAngleDeg: side === 'front' ? 49 : 53,
  })
  const beforeContact = sampleBallisticArc(incoming, 57)
  const incomingVelocity = velocityAtTime(incoming, incoming.duration)
  const normal = {
    x: 0,
    y: sideSign * radialOffset,
    z: verticalOffset,
  }
  const outgoingVelocity = reflect(incomingVelocity, normal, 0.58)
  const afterContact = sampleFreeFlight(
    contact,
    outgoingVelocity,
    outcome === 'rim-out' ? 0.92 : 0.72,
    37,
  ).slice(1)
  const points = [...beforeContact, ...afterContact]
  const contactType =
    side === 'front' ? 'front-rim-contact' : 'back-rim-contact'

  return {
    outcome,
    points,
    events: [
      event('release', 0, points),
      event(contactType, beforeContact.length - 1, points),
      event('miss', points.length - 1, points),
    ],
    duration: incoming.duration + (outcome === 'rim-out' ? 0.92 : 0.72),
  }
}

function createBankMake(origin: Point3): ShotPath {
  const boardContact: Point3 = {
    x: Math.max(-0.58, Math.min(0.58, origin.x * 0.12)),
    y: COURT.backboardY + COURT.ballRadius,
    z: 3.48,
  }
  const toBoard = solveBallisticArc({
    origin,
    target: boardContact,
    launchAngleDeg: 47,
  })
  const boardPoints = sampleBallisticArc(toBoard, 49)
  const toRim = solveBallisticArc({
    origin: boardContact,
    target: COURT.rim,
    launchAngleDeg: 12,
  })
  const rimPoints = sampleBallisticArc(toRim, 29).slice(1)
  const crossingIndex = boardPoints.length + rimPoints.length - 2
  const afterRim = sampleTimeRange(
    toRim,
    toRim.duration,
    toRim.duration + 0.28,
    13,
  ).slice(1)
  const points = [...boardPoints, ...rimPoints, ...afterRim]

  return {
    outcome: 'bank-make',
    points,
    events: [
      event('release', 0, points),
      event('backboard-contact', boardPoints.length - 1, points),
      event('rim-crossing', crossingIndex, points),
      event('made', crossingIndex + 4, points),
    ],
    duration: toBoard.duration + toRim.duration + 0.28,
  }
}

export function createShotPath({ origin, outcome }: ShotInput): ShotPath {
  switch (outcome) {
    case 'swish':
      return createThroughShot(origin, COURT.rim, outcome)
    case 'airball': {
      const side = origin.x >= 0 ? 1 : -1
      return createThroughShot(
        origin,
        {
          x: COURT.rim.x + side * 1.35,
          y: COURT.rim.y,
          z: COURT.rim.z,
        },
        outcome,
      )
    }
    case 'front-rim':
      return createRimContactShot(origin, 'front', outcome)
    case 'back-rim':
      return createRimContactShot(origin, 'back', outcome)
    case 'rim-out':
      return createRimContactShot(origin, 'back', outcome)
    case 'bank-make':
      return createBankMake(origin)
  }
}
