import { useCallback, useState } from 'react'

const STORAGE_KEY = 'basketball-playbook-progress:v1'

type StoredProgress = Readonly<{
  completedIds: readonly string[]
  lastTermId: string
}>

function readProgress(): StoredProgress {
  if (typeof window === 'undefined') {
    return { completedIds: [], lastTermId: 'pick-and-roll' }
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { completedIds: [], lastTermId: 'pick-and-roll' }
    }
    const parsed = JSON.parse(raw) as Partial<StoredProgress>
    return {
      completedIds: Array.isArray(parsed.completedIds)
        ? parsed.completedIds.filter(
            (value): value is string => typeof value === 'string',
          )
        : [],
      lastTermId:
        typeof parsed.lastTermId === 'string'
          ? parsed.lastTermId
          : 'pick-and-roll',
    }
  } catch {
    return { completedIds: [], lastTermId: 'pick-and-roll' }
  }
}

function writeProgress(progress: StoredProgress): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Learning remains fully usable when storage is disabled.
  }
}

export function useProgress() {
  const [progress, setProgress] = useState(readProgress)

  const selectTerm = useCallback((termId: string) => {
    setProgress((current) => {
      const next = { ...current, lastTermId: termId }
      writeProgress(next)
      return next
    })
  }, [])

  const completeTerm = useCallback((termId: string) => {
    setProgress((current) => {
      const completedIds = Array.from(
        new Set([...current.completedIds, termId]),
      )
      const next = { ...current, completedIds }
      writeProgress(next)
      return next
    })
  }, [])

  return {
    completedIds: new Set(progress.completedIds),
    lastTermId: progress.lastTermId,
    selectTerm,
    completeTerm,
  }
}
