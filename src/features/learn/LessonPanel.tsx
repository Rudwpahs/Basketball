import { AlertTriangle, ArrowUpRight, Crosshair } from 'lucide-react'
import type { Term } from '../../data/terms'
import type { SimulationFrame } from '../../sim/scenario'

const CATEGORY_NAMES = {
  offense: 'OFFENSE',
  defense: 'DEFENSE',
  shooting: 'SHOOTING',
  'ball-handling': 'BALL HANDLING',
  passing: 'PASSING',
  rules: 'RULES',
  court: 'COURT',
} as const

type LessonPanelProps = Readonly<{
  term: Term
  frame: SimulationFrame
  completed: boolean
  onOpenQuiz: () => void
}>

export function LessonPanel({
  term,
  frame,
  completed,
  onOpenQuiz,
}: LessonPanelProps) {
  return (
    <article className="lesson-panel">
      <header className="lesson-panel__header">
        <div className="lesson-panel__meta">
          <span>{CATEGORY_NAMES[term.category]}</span>
          <span>{term.difficulty}</span>
          <span>{term.mode}</span>
        </div>
        <h1>{term.name}</h1>
        <p className="lesson-panel__korean">{term.korean}</p>
        <p className="lesson-panel__summary">{term.summary}</p>
      </header>

      <section className="phase-note" aria-live="polite">
        <span>CURRENT READ · {String(frame.phaseIndex + 1).padStart(2, '0')}</span>
        <strong>{frame.phase.label}</strong>
        <p>{frame.phase.description}</p>
      </section>

      <section className="lesson-block">
        <h2>왜 중요한가</h2>
        <p>{term.whyItMatters}</p>
      </section>

      <section className="lesson-callout lesson-callout--cue">
        <Crosshair size={18} aria-hidden="true" />
        <div>
          <span>COACH CUE</span>
          <p>{term.coachCue}</p>
        </div>
      </section>

      <section className="lesson-callout lesson-callout--mistake">
        <AlertTriangle size={18} aria-hidden="true" />
        <div>
          <span>COMMON MISTAKE</span>
          <p>{term.commonMistake}</p>
        </div>
      </section>

      <button
        type="button"
        className="quiz-launch"
        onClick={onOpenQuiz}
      >
        <span>{completed ? '완료한 퀴즈 다시 풀기' : '이 용어 확인하기'}</span>
        <ArrowUpRight size={19} aria-hidden="true" />
      </button>
    </article>
  )
}
