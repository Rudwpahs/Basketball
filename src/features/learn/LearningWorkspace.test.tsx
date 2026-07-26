import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from '../../App'
import { getTermById } from '../../data/terms'

describe('learning workstation', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('finds a Korean term and opens its related lesson', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByRole('searchbox'), '에어볼')
    await user.click(
      screen.getByRole('button', { name: /airball.*에어볼/i }),
    )

    expect(
      screen.getByRole('heading', { name: /airball/i }),
    ).toBeVisible()
    expect(
      screen.getByText(/림과 백보드에 닿지 않고/i),
    ).toBeVisible()
  })

  it('steps to the next basketball phase without autoplay', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(
      screen.getByText('READ', { selector: '.phase-chip' }),
    ).toBeVisible()
    await user.click(screen.getByRole('button', { name: '다음 단계' }))

    expect(
      screen.getByText('SCREEN', { selector: '.phase-chip' }),
    ).toBeVisible()
  })

  it('opens and closes the mobile term index', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '플레이북 열기' }))
    expect(
      screen.getByRole('dialog', { name: '농구 용어 플레이북' }),
    ).toBeVisible()

    await user.click(screen.getByRole('button', { name: '플레이북 닫기' }))
    expect(
      screen.queryByRole('dialog', { name: '농구 용어 플레이북' }),
    ).not.toBeInTheDocument()
  })

  it('marks a term complete after a correct quiz answer', async () => {
    const user = userEvent.setup()
    const term = getTermById('pick-and-roll')
    render(<App />)

    await user.click(
      screen.getByRole('button', { name: '이 용어 확인하기' }),
    )
    expect(
      screen.getByRole('dialog', { name: /픽앤롤 퀴즈/ }),
    ).toBeVisible()

    await user.click(screen.getByText(term.quiz.answer))

    expect(screen.getByRole('status')).toHaveTextContent('정확합니다.')
    expect(screen.getByLabelText('학습 진행률')).toHaveTextContent('1 / 74')
  })
})
