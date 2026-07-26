import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from 'lucide-react'
import type { Scenario, SimulationFrame } from '../../sim/scenario'
import type { PlaybackSpeed } from './usePlayback'

type PlaybackControlsProps = Readonly<{
  scenario: Scenario
  frame: SimulationFrame
  playing: boolean
  speed: PlaybackSpeed
  reducedMotion: boolean
  onPrevious: () => void
  onToggle: () => void
  onNext: () => void
  onSeek: (elapsedMs: number) => void
  onSpeedChange: (speed: PlaybackSpeed) => void
  onPhaseChange: (index: number) => void
}>

export function PlaybackControls({
  scenario,
  frame,
  playing,
  speed,
  reducedMotion,
  onPrevious,
  onToggle,
  onNext,
  onSeek,
  onSpeedChange,
  onPhaseChange,
}: PlaybackControlsProps) {
  return (
    <section className="playback" aria-label="플레이 재생">
      <div className="playback__timeline">
        <span className="phase-chip">{frame.phase.label}</span>
        <input
          className="playback__range"
          type="range"
          min="0"
          max={frame.durationMs}
          step="10"
          value={frame.elapsedMs}
          aria-label="재생 위치"
          onChange={(event) => onSeek(Number(event.currentTarget.value))}
        />
        <span className="playback__count">
          {frame.phaseIndex + 1}/{scenario.phases.length}
        </span>
      </div>

      <div className="playback__actions">
        <button
          type="button"
          className="icon-button"
          aria-label="이전 단계"
          disabled={frame.phaseIndex === 0}
          onClick={onPrevious}
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="play-button"
          aria-label={
            reducedMotion
              ? '다음 핵심 장면'
              : playing
                ? '일시정지'
                : '재생'
          }
          onClick={onToggle}
        >
          {playing ? (
            <Pause size={20} fill="currentColor" aria-hidden="true" />
          ) : (
            <Play size={20} fill="currentColor" aria-hidden="true" />
          )}
          <span>
            {reducedMotion ? 'STEP' : playing ? 'PAUSE' : 'PLAY'}
          </span>
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label="다음 단계"
          disabled={frame.phaseIndex === scenario.phases.length - 1}
          onClick={onNext}
        >
          <ChevronRight size={20} aria-hidden="true" />
        </button>

        <label className="speed-control">
          <span>속도</span>
          <select
            aria-label="재생 속도"
            value={speed}
            onChange={(event) =>
              onSpeedChange(Number(event.currentTarget.value) as PlaybackSpeed)
            }
          >
            <option value={0.5}>0.5×</option>
            <option value={1}>1×</option>
            <option value={1.5}>1.5×</option>
          </select>
        </label>
      </div>

      <div className="phase-tabs" aria-label="플레이 단계">
        {scenario.phases.map((phase, index) => (
          <button
            key={phase.id}
            type="button"
            aria-current={index === frame.phaseIndex ? 'step' : undefined}
            onClick={() => onPhaseChange(index)}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            {phase.label}
          </button>
        ))}
      </div>
    </section>
  )
}
