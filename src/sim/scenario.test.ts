import { describe, expect, it } from 'vitest'
import { SCENARIOS } from '../data/scenarios'
import { COURT } from './court'
import { evaluateScenario } from './scenario'

describe('scenario timeline', () => {
  it('keeps the ball attached to its carrier during an owned phase', () => {
    const frame = evaluateScenario(SCENARIOS['pick-and-roll'], 200)
    const handler = frame.actors.handler

    expect(frame.ball.ownerId).toBe('handler')
    expect(frame.ball.position.x).toBeCloseTo(handler.position.x, 8)
    expect(frame.ball.position.y).toBeCloseTo(handler.position.y, 8)
    expect(frame.ball.position.z).toBeGreaterThan(handler.position.z)
  })

  it('gives a pass visible height between two players', () => {
    const scenario = SCENARIOS['give-and-go']
    const passPhaseStart = scenario.phases[0].durationMs
    const frame = evaluateScenario(
      scenario,
      passPhaseStart + scenario.phases[1].durationMs / 2,
    )

    expect(frame.ball.ownerId).toBeNull()
    expect(frame.ball.position.z).toBeGreaterThan(1.8)
    expect(frame.phase.id).toBe('give')
  })

  it('uses the semantic shot engine during a shot phase', () => {
    const scenario = SCENARIOS.airball
    const shotPhaseStart = scenario.phases[0].durationMs
    const frame = evaluateScenario(
      scenario,
      shotPhaseStart + scenario.phases[1].durationMs * 0.65,
    )

    expect(frame.ball.ownerId).toBeNull()
    expect(frame.ball.shotOutcome).toBe('airball')
    expect(frame.ball.position.z).toBeGreaterThan(0)
  })

  it('clamps elapsed time before the start and after the finish', () => {
    const scenario = SCENARIOS.crossover
    const first = evaluateScenario(scenario, -100)
    const last = evaluateScenario(scenario, Number.POSITIVE_INFINITY)

    expect(first.progress).toBe(0)
    expect(last.progress).toBe(1)
    expect(last.phaseIndex).toBe(scenario.phases.length - 1)
  })

  it('moves the crossover ball across the body on a real bounce', () => {
    const scenario = SCENARIOS.crossover
    const phaseStart = scenario.phases[0].durationMs
    const early = evaluateScenario(
      scenario,
      phaseStart + scenario.phases[1].durationMs * 0.2,
    )
    const late = evaluateScenario(
      scenario,
      phaseStart + scenario.phases[1].durationMs * 0.8,
    )
    const earlyActor = early.actors.handler.position
    const lateActor = late.actors.handler.position

    expect(early.ball.position.z).toBeGreaterThan(COURT.ballRadius)
    expect(late.ball.position.z).toBeGreaterThan(COURT.ballRadius)
    expect(early.ball.position.x - earlyActor.x).toBeLessThan(0)
    expect(late.ball.position.x - lateActor.x).toBeGreaterThan(0)
    expect(early.ball.position.z).not.toBeCloseTo(late.ball.position.z)
  })
})
