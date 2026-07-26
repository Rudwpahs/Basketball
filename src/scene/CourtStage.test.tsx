import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SCENARIOS } from '../data/scenarios'
import { evaluateScenario } from '../sim/scenario'
import { CourtStage } from './CourtStage'

describe('CourtStage', () => {
  it('keeps a useful accessible court description without WebGL', () => {
    const scenario = SCENARIOS['pick-and-roll']
    const frame = evaluateScenario(scenario, 0)

    render(
      <CourtStage
        frame={frame}
        highlight={scenario.highlight}
        forceFallback
      />,
    )

    expect(
      screen.getByRole('img', { name: frame.a11yDescription }),
    ).toBeVisible()
    expect(screen.getByText(/3d 코트를 불러올 수 없습니다/i)).toBeVisible()
  })
})
