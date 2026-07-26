import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('Basketball Playbook Lab shell', () => {
  it('labels the primary learning surface', () => {
    render(<App />)

    expect(
      screen.getByRole('main', { name: /basketball playbook lab/i }),
    ).toBeVisible()
  })
})
