import { describe, expect, it } from 'vitest'
import { SCENARIOS } from './scenarios'
import { TERMS, getTermById } from './terms'

describe('lesson content contract', () => {
  it('ships exactly 74 unique complete lessons', () => {
    expect(TERMS).toHaveLength(74)
    expect(new Set(TERMS.map((term) => term.id)).size).toBe(74)

    for (const term of TERMS) {
      expect(term.name.length).toBeGreaterThan(1)
      expect(term.korean.length).toBeGreaterThan(1)
      expect(term.summary.length).toBeGreaterThan(20)
      expect(term.coachCue.length).toBeGreaterThan(10)
      expect(term.commonMistake.length).toBeGreaterThan(10)
      expect(SCENARIOS[term.scenarioId]).toBeDefined()
      expect(SCENARIOS[term.scenarioId].mode).toBe(term.mode)
      expect(term.quiz.options).toHaveLength(4)
      expect(new Set(term.quiz.options).size).toBe(4)
      expect(term.quiz.options).toContain(term.quiz.answer)
    }
  })

  it('maps outcome terms to matching physical shot scenarios', () => {
    expect(SCENARIOS[getTermById('airball').scenarioId].shotOutcome).toBe(
      'airball',
    )
    expect(SCENARIOS[getTermById('swish').scenarioId].shotOutcome).toBe(
      'swish',
    )
    expect(SCENARIOS[getTermById('bank-shot').scenarioId].shotOutcome).toBe(
      'bank-make',
    )
    expect(SCENARIOS[getTermById('rim-out').scenarioId].shotOutcome).toBe(
      'rim-out',
    )
  })

  it('uses no generic scenario ID for unrelated lessons', () => {
    for (const term of TERMS) {
      expect(term.scenarioId).toBe(term.id)
    }
  })
})
