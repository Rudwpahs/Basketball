import { describe, expect, it } from 'vitest'
import { inspectShotPath } from '../sim/collisions'
import { getThreePointArc } from '../sim/court'
import { createShotPath, type ShotOutcome } from '../sim/shots'
import { SCENARIOS } from './scenarios'
import { TERMS, getTermById } from './terms'

describe('content accuracy regressions', () => {
  it('maps outcome-specific lessons to matching shot scenarios', () => {
    const expected = {
      airball: 'airball',
      'rim-out': 'rim-out',
      swish: 'swish',
      'bank-shot': 'bank-make',
      'three-pointer': 'swish',
      floater: 'swish',
    } satisfies Record<string, ShotOutcome>

    for (const [termId, outcome] of Object.entries(expected)) {
      const term = getTermById(termId)
      const scenario = SCENARIOS[term.scenarioId]
      expect(scenario.shotOutcome, termId).toBe(outcome)
    }
  })

  it('keeps the airball clear of both rim and backboard', () => {
    const path = createShotPath({
      origin: { x: 3.8, y: 8, z: 2.1 },
      outcome: 'airball',
    })
    const inspection = inspectShotPath(path)

    expect(inspection.rimContacts).toHaveLength(0)
    expect(inspection.backboardContacts).toHaveLength(0)
    expect(inspection.minimumRimClearance).toBeGreaterThan(0)
  })

  it('opens the three-point arc toward midcourt and highlights it', () => {
    const arc = getThreePointArc()
    const term = getTermById('three-point-line')
    const scenario = SCENARIOS[term.scenarioId]

    expect(Math.min(...arc.map((point) => point.y))).toBeGreaterThan(1.6)
    expect(scenario.mode).toBe('court')
    expect(scenario.highlight).toBe('three-point-line')
  })

  it('keeps every lesson attached to a compatible scenario', () => {
    for (const term of TERMS) {
      const scenario = SCENARIOS[term.scenarioId]
      expect(scenario, term.id).toBeDefined()
      expect(scenario.mode, term.id).toBe(term.mode)
      expect(scenario.phases.length, term.id).toBeGreaterThan(0)
      expect(
        scenario.phases.every(
          (phase) =>
            phase.label.trim().length > 0 &&
            phase.description.trim().length > 12,
        ),
        term.id,
      ).toBe(true)
    }
  })
})
