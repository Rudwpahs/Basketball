import { COURT } from './court'
import { createShotPath, type ShotOutcome, type ShotPath } from './shots'
import type { Point3 } from './types'

export type VisualizationMode = 'play' | 'skill' | 'shot' | 'court' | 'rule'
export type TeamSide = 'offense' | 'defense'
export type BallMotion =
  | 'hold'
  | 'dribble'
  | 'crossover'
  | 'between-the-legs'
  | 'behind-the-back'
  | 'hesitation'
  | 'in-and-out'
  | 'spin'

export type ActorSpec = Readonly<{
  id: string
  label: string
  number: number
  team: TeamSide
  start: Point3
}>

export type BallInstruction =
  | Readonly<{
      type: 'owned'
      ownerId: string
      motion?: BallMotion
    }>
  | Readonly<{
      type: 'pass'
      fromId: string
      toId: string
      arcHeight?: number
      style?: 'direct' | 'bounce' | 'lob'
    }>
  | Readonly<{
      type: 'shot'
      shooterId: string
      outcome: ShotOutcome
    }>
  | Readonly<{ type: 'none' }>

export type ScenarioPhase = Readonly<{
  id: string
  label: string
  description: string
  durationMs: number
  positions?: Readonly<Record<string, Point3>>
  ball: BallInstruction
  focusActorIds?: readonly string[]
}>

export type CourtHighlight =
  | 'paint'
  | 'left-elbow'
  | 'right-wing'
  | 'right-corner'
  | 'three-point-line'
  | 'restricted-area'

export type Scenario = Readonly<{
  id: string
  title: string
  mode: VisualizationMode
  actors: readonly ActorSpec[]
  phases: readonly ScenarioPhase[]
  shotOutcome?: ShotOutcome
  highlight?: CourtHighlight
}>

export type SimulationActor = Readonly<{
  id: string
  label: string
  number: number
  team: TeamSide
  position: Point3
  focused: boolean
}>

export type SimulationBall = Readonly<{
  ownerId: string | null
  position: Point3
  visible: boolean
  shotOutcome?: ShotOutcome
}>

export type SimulationFrame = Readonly<{
  actors: Readonly<Record<string, SimulationActor>>
  ball: SimulationBall
  phase: ScenarioPhase
  phaseIndex: number
  phaseProgress: number
  progress: number
  elapsedMs: number
  durationMs: number
  a11yDescription: string
}>

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress
}

function interpolatePoint(
  start: Point3,
  end: Point3,
  progress: number,
): Point3 {
  return {
    x: lerp(start.x, end.x, progress),
    y: lerp(start.y, end.y, progress),
    z: lerp(start.z, end.z, progress),
  }
}

function easeInOut(progress: number): number {
  return progress * progress * (3 - 2 * progress)
}

function getPhasePositionStates(
  scenario: Scenario,
  phaseIndex: number,
): Readonly<{
  start: Record<string, Point3>
  end: Record<string, Point3>
}> {
  const current: Record<string, Point3> = Object.fromEntries(
    scenario.actors.map((actor) => [actor.id, actor.start]),
  )

  for (let index = 0; index < phaseIndex; index += 1) {
    Object.assign(current, scenario.phases[index].positions)
  }

  return {
    start: { ...current },
    end: { ...current, ...scenario.phases[phaseIndex].positions },
  }
}

function heldBallPosition(
  actorPosition: Point3,
  progress: number,
  motion: BallMotion = 'hold',
): Point3 {
  if (motion === 'hold') {
    return {
      x: actorPosition.x,
      y: actorPosition.y,
      z: actorPosition.z + 1.25,
    }
  }

  const bounceHeight =
    COURT.ballRadius +
    Math.abs(Math.cos(progress * Math.PI * 1.6)) * 0.98
  const crossBody = -0.43 + easeInOut(progress) * 0.86

  switch (motion) {
    case 'crossover':
      return {
        x: actorPosition.x + crossBody,
        y: actorPosition.y - 0.14,
        z: bounceHeight,
      }
    case 'between-the-legs':
      return {
        x: actorPosition.x + crossBody * 0.88,
        y: actorPosition.y + 0.02,
        z: bounceHeight,
      }
    case 'behind-the-back':
      return {
        x: actorPosition.x + crossBody,
        y: actorPosition.y + 0.34,
        z: bounceHeight + 0.06,
      }
    case 'hesitation':
      return {
        x: actorPosition.x + 0.31,
        y: actorPosition.y - 0.1,
        z:
          COURT.ballRadius +
          Math.abs(Math.cos(progress * Math.PI)) * 1.08,
      }
    case 'in-and-out':
      return {
        x:
          actorPosition.x -
          0.38 +
          Math.sin(progress * Math.PI) * 0.34,
        y: actorPosition.y - 0.16,
        z: bounceHeight,
      }
    case 'spin': {
      const angle = progress * Math.PI * 2
      return {
        x: actorPosition.x + Math.cos(angle) * 0.34,
        y: actorPosition.y + Math.sin(angle) * 0.34,
        z: bounceHeight,
      }
    }
    case 'dribble':
      return {
        x: actorPosition.x + 0.32,
        y: actorPosition.y - 0.12,
        z: bounceHeight,
      }
  }
}

function passPosition(
  from: Point3,
  to: Point3,
  progress: number,
  arcHeight: number,
  style: 'direct' | 'bounce' | 'lob',
): Point3 {
  const start = { ...from, z: from.z + 1.45 }
  const end = { ...to, z: to.z + 1.3 }

  if (style === 'bounce') {
    const bounceProgress = 0.56
    const bounce = {
      x: lerp(start.x, end.x, bounceProgress),
      y: lerp(start.y, end.y, bounceProgress),
      z: 0.13,
    }
    if (progress <= bounceProgress) {
      const local = progress / bounceProgress
      return interpolatePoint(start, bounce, easeInOut(local))
    }
    const local = (progress - bounceProgress) / (1 - bounceProgress)
    return interpolatePoint(bounce, end, easeInOut(local))
  }

  const lift = 4 * arcHeight * progress * (1 - progress)

  return {
    x: lerp(start.x, end.x, progress),
    y: lerp(start.y, end.y, progress),
    z: lerp(start.z, end.z, progress) + lift,
  }
}

const shotCache = new WeakMap<ScenarioPhase, ShotPath>()

function getPhaseShot(
  phase: ScenarioPhase,
  origin: Point3,
  outcome: ShotOutcome,
): ShotPath {
  const cached = shotCache.get(phase)
  if (cached) {
    return cached
  }

  const shot = createShotPath({
    origin: { ...origin, z: 2.1 },
    outcome,
  })
  shotCache.set(phase, shot)
  return shot
}

function findPhase(
  scenario: Scenario,
  elapsedMs: number,
): Readonly<{
  phaseIndex: number
  phaseStartMs: number
  durationMs: number
}> {
  const durationMs = scenario.phases.reduce(
    (total, phase) => total + phase.durationMs,
    0,
  )
  const safeElapsed = Number.isFinite(elapsedMs)
    ? clamp(elapsedMs, 0, durationMs)
    : elapsedMs > 0
      ? durationMs
      : 0
  let cursor = 0

  for (let index = 0; index < scenario.phases.length; index += 1) {
    const phaseEnd = cursor + scenario.phases[index].durationMs
    if (safeElapsed < phaseEnd || index === scenario.phases.length - 1) {
      return {
        phaseIndex: index,
        phaseStartMs: cursor,
        durationMs,
      }
    }
    cursor = phaseEnd
  }

  return {
    phaseIndex: scenario.phases.length - 1,
    phaseStartMs:
      durationMs - scenario.phases.at(-1)!.durationMs,
    durationMs,
  }
}

export function evaluateScenario(
  scenario: Scenario,
  elapsedMs: number,
): SimulationFrame {
  if (scenario.phases.length === 0) {
    throw new RangeError('A scenario must have at least one phase')
  }

  const located = findPhase(scenario, elapsedMs)
  const safeElapsed = Number.isFinite(elapsedMs)
    ? clamp(elapsedMs, 0, located.durationMs)
    : elapsedMs > 0
      ? located.durationMs
      : 0
  const phase = scenario.phases[located.phaseIndex]
  const rawPhaseProgress = clamp(
    (safeElapsed - located.phaseStartMs) / phase.durationMs,
    0,
    1,
  )
  const positionProgress = easeInOut(rawPhaseProgress)
  const states = getPhasePositionStates(scenario, located.phaseIndex)
  const focused = new Set(phase.focusActorIds ?? [])
  const actors = Object.fromEntries(
    scenario.actors.map((actor) => {
      const start = states.start[actor.id]
      const end = states.end[actor.id]
      return [
        actor.id,
        {
          id: actor.id,
          label: actor.label,
          number: actor.number,
          team: actor.team,
          position: interpolatePoint(start, end, positionProgress),
          focused: focused.has(actor.id),
        } satisfies SimulationActor,
      ]
    }),
  )

  let ball: SimulationBall
  switch (phase.ball.type) {
    case 'owned': {
      const owner = actors[phase.ball.ownerId]
      if (!owner) {
        throw new Error(`Unknown ball owner: ${phase.ball.ownerId}`)
      }
      ball = {
        ownerId: owner.id,
        position: heldBallPosition(
          owner.position,
          rawPhaseProgress,
          phase.ball.motion,
        ),
        visible: true,
      }
      break
    }
    case 'pass': {
      const from = states.start[phase.ball.fromId]
      const to = states.end[phase.ball.toId]
      if (!from || !to) {
        throw new Error('Pass references an unknown actor')
      }
      ball = {
        ownerId: null,
        position: passPosition(
          from,
          to,
          rawPhaseProgress,
          phase.ball.arcHeight ?? 1.1,
          phase.ball.style ?? 'direct',
        ),
        visible: true,
      }
      break
    }
    case 'shot': {
      const shooterOrigin = states.start[phase.ball.shooterId]
      if (!shooterOrigin) {
        throw new Error(`Unknown shooter: ${phase.ball.shooterId}`)
      }
      const shot = getPhaseShot(
        phase,
        shooterOrigin,
        phase.ball.outcome,
      )
      const pointIndex = Math.min(
        shot.points.length - 1,
        Math.floor(rawPhaseProgress * shot.points.length),
      )
      ball = {
        ownerId: null,
        position: shot.points[pointIndex],
        visible: true,
        shotOutcome: phase.ball.outcome,
      }
      break
    }
    case 'none':
      ball = {
        ownerId: null,
        position: { x: 0, y: 0, z: -1 },
        visible: false,
      }
      break
  }

  return {
    actors,
    ball,
    phase,
    phaseIndex: located.phaseIndex,
    phaseProgress: rawPhaseProgress,
    progress:
      located.durationMs === 0 ? 1 : safeElapsed / located.durationMs,
    elapsedMs: safeElapsed,
    durationMs: located.durationMs,
    a11yDescription: `${scenario.title}. ${phase.label}. ${phase.description}`,
  }
}

export function getScenarioDuration(scenario: Scenario): number {
  return scenario.phases.reduce(
    (total, phase) => total + phase.durationMs,
    0,
  )
}
