import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useProgress } from './useProgress'

const STORAGE_KEY = 'basketball-playbook-progress:v1'

describe('useProgress', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('persists only completed IDs and the last selected term', () => {
    const { result, unmount } = renderHook(() => useProgress())

    act(() => {
      result.current.selectTerm('airball')
      result.current.completeTerm('airball')
      result.current.completeTerm('airball')
    })

    expect(result.current.completedIds).toEqual(new Set(['airball']))
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!)).toEqual({
      completedIds: ['airball'],
      lastTermId: 'airball',
    })

    unmount()
    const restored = renderHook(() => useProgress())
    expect(restored.result.current.lastTermId).toBe('airball')
    expect(restored.result.current.completedIds.has('airball')).toBe(true)
  })

  it('recovers safely from malformed local storage', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not json')

    const { result } = renderHook(() => useProgress())

    expect(result.current.completedIds.size).toBe(0)
    expect(result.current.lastTermId).toBe('pick-and-roll')
  })
})
