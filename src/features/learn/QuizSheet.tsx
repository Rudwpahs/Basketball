import { Check, RotateCcw, X } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import type { Term } from '../../data/terms'

type QuizSheetProps = Readonly<{
  term: Term
  open: boolean
  onClose: () => void
  onComplete: (termId: string) => void
}>

export function QuizSheet({
  term,
  open,
  onClose,
  onComplete,
}: QuizSheetProps) {
  const titleId = useId()
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    setSelected(null)
  }, [open, term.id])

  if (!open) {
    return null
  }

  const answered = selected !== null
  const correct = selected === term.quiz.answer

  const choose = (option: string) => {
    if (answered) {
      return
    }
    setSelected(option)
    if (option === term.quiz.answer) {
      onComplete(term.id)
    }
  }

  return (
    <div className="sheet-backdrop" onMouseDown={onClose}>
      <section
        className="quiz-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <span>PLAYBOOK CHECK</span>
            <h2 id={titleId}>{term.korean} 퀴즈</h2>
          </div>
          <button
            type="button"
            className="icon-button icon-button--light"
            aria-label="퀴즈 닫기"
            onClick={onClose}
            autoFocus
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <p className="quiz-sheet__question">{term.quiz.question}</p>
        <div className="quiz-options">
          {term.quiz.options.map((option, index) => {
            const isAnswer = option === term.quiz.answer
            const isSelected = option === selected
            return (
              <button
                key={option}
                type="button"
                disabled={answered}
                data-result={
                  answered
                    ? isAnswer
                      ? 'correct'
                      : isSelected
                        ? 'wrong'
                        : undefined
                    : undefined
                }
                onClick={() => choose(option)}
              >
                <span>{String.fromCharCode(65 + index)}</span>
                <strong>{option}</strong>
                {answered && isAnswer ? (
                  <Check size={18} aria-hidden="true" />
                ) : null}
              </button>
            )
          })}
        </div>

        {answered ? (
          <div
            className={`quiz-result quiz-result--${correct ? 'correct' : 'wrong'}`}
            role="status"
          >
            <strong>{correct ? '정확합니다.' : '다시 읽어 보세요.'}</strong>
            <p>{term.quiz.explanation}</p>
            {correct ? (
              <button type="button" onClick={onClose}>
                플레이북으로 돌아가기
              </button>
            ) : (
              <button type="button" onClick={() => setSelected(null)}>
                <RotateCcw size={16} aria-hidden="true" />
                다시 선택하기
              </button>
            )}
          </div>
        ) : null}
      </section>
    </div>
  )
}
