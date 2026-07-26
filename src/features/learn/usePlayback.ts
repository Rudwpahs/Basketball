import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import {
  evaluateScenario,
  getScenarioDuration,
  type Scenario,
} from '../../sim/scenario'

export type PlaybackSpeed = 0.5 | 1 | 1.5

export function usePlayback(scenario: Scenario) {
  const durationMs = useMemo(
    () => getScenarioDuration(scenario),
    [scenario],
  )
  const phaseStarts = useMemo(() => {
    let cursor = 0
    return scenario.phases.map((phase) => {
      const start = cursor
      cursor += phase.durationMs
      return start
    })
  }, [scenario])
  const reducedMotion = useReducedMotion()
  const [elapsedMs, setElapsedMs] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<PlaybackSpeed>(1)
  const animationFrame = useRef<number | null>(null)
  const previousTimestamp = useRef<number | null>(null)
  const frame = evaluateScenario(scenario, elapsedMs)

  useEffect(() => {
    setElapsedMs(0)
    setPlaying(false)
    previousTimestamp.current = null
  }, [scenario.id])

  const goToPhase = useCallback(
    (phaseIndex: number) => {
      const safeIndex = Math.max(
        0,
        Math.min(scenario.phases.length - 1, phaseIndex),
      )
      setElapsedMs(phaseStarts[safeIndex])
      setPlaying(false)
      previousTimestamp.current = null
    },
    [phaseStarts, scenario.phases.length],
  )

  const previousPhase = useCallback(() => {
    goToPhase(frame.phaseIndex - 1)
  }, [frame.phaseIndex, goToPhase])

  const nextPhase = useCallback(() => {
    goToPhase(frame.phaseIndex + 1)
  }, [frame.phaseIndex, goToPhase])

  const togglePlayback = useCallback(() => {
    if (reducedMotion) {
      nextPhase()
      return
    }

    if (elapsedMs >= durationMs) {
      setElapsedMs(0)
    }
    setPlaying((current) => !current)
    previousTimestamp.current = null
  }, [durationMs, elapsedMs, nextPhase, reducedMotion])

  useEffect(() => {
    if (!playing) {
      if (animationFrame.current !== null) {
        window.cancelAnimationFrame(animationFrame.current)
        animationFrame.current = null
      }
      return undefined
    }

    const tick = (timestamp: number) => {
      if (previousTimestamp.current === null) {
        previousTimestamp.current = timestamp
      }
      const delta = timestamp - previousTimestamp.current
      previousTimestamp.current = timestamp

      setElapsedMs((current) => {
        const next = Math.min(durationMs, current + delta * speed)
        if (next >= durationMs) {
          setPlaying(false)
        }
        return next
      })
      animationFrame.current = window.requestAnimationFrame(tick)
    }

    animationFrame.current = window.requestAnimationFrame(tick)
    return () => {
      if (animationFrame.current !== null) {
        window.cancelAnimationFrame(animationFrame.current)
      }
      animationFrame.current = null
      previousTimestamp.current = null
    }
  }, [durationMs, playing, speed])

  return {
    elapsedMs,
    durationMs,
    frame,
    playing,
    speed,
    reducedMotion,
    setSpeed,
    seek: (value: number) => {
      setElapsedMs(Math.max(0, Math.min(durationMs, value)))
      setPlaying(false)
    },
    goToPhase,
    previousPhase,
    nextPhase,
    togglePlayback,
  }
}
