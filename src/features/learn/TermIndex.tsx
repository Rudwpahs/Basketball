import { Check, Search } from 'lucide-react'
import type { Term, TermCategory } from '../../data/terms'

export type CategoryFilter = TermCategory | 'all'

const CATEGORY_LABELS: Readonly<Record<CategoryFilter, string>> = {
  all: '전체',
  offense: '공격',
  defense: '수비',
  shooting: '슈팅',
  'ball-handling': '볼 핸들링',
  passing: '패스',
  rules: '규칙',
  court: '코트',
}

type TermIndexProps = Readonly<{
  terms: readonly Term[]
  allTerms: readonly Term[]
  selectedId: string
  category: CategoryFilter
  query: string
  completedIds: ReadonlySet<string>
  onCategoryChange: (category: CategoryFilter) => void
  onSelect: (id: string) => void
}>

export function TermIndex({
  terms,
  allTerms,
  selectedId,
  category,
  query,
  completedIds,
  onCategoryChange,
  onSelect,
}: TermIndexProps) {
  const categories = Object.keys(CATEGORY_LABELS) as CategoryFilter[]

  return (
    <div className="term-index">
      <div className="term-index__categories" aria-label="용어 분류">
        {categories.map((item) => {
          const count =
            item === 'all'
              ? allTerms.length
              : allTerms.filter((term) => term.category === item).length
          return (
            <button
              key={item}
              type="button"
              className="category-button"
              aria-pressed={category === item}
              onClick={() => onCategoryChange(item)}
            >
              <span>{CATEGORY_LABELS[item]}</span>
              <small>{String(count).padStart(2, '0')}</small>
            </button>
          )
        })}
      </div>

      <div className="term-index__label">
        <span>
          {query ? `“${query}” 검색 결과` : CATEGORY_LABELS[category]}
        </span>
        <span>{terms.length}</span>
      </div>

      <div className="term-index__list" aria-live="polite">
        {terms.length > 0 ? (
          terms.map((term, index) => {
            const completed = completedIds.has(term.id)
            return (
              <button
                key={term.id}
                type="button"
                className="term-card"
                aria-current={term.id === selectedId ? 'page' : undefined}
                aria-label={`${term.name} — ${term.korean}`}
                onClick={() => onSelect(term.id)}
              >
                <span className="term-card__number">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="term-card__copy">
                  <strong>{term.name}</strong>
                  <small>{term.korean}</small>
                </span>
                {completed ? (
                  <Check
                    className="term-card__check"
                    size={16}
                    aria-label="완료"
                  />
                ) : (
                  <span className="term-card__mode">{term.mode}</span>
                )}
              </button>
            )
          })
        ) : (
          <div className="term-index__empty">
            <Search size={22} aria-hidden="true" />
            <strong>일치하는 용어가 없습니다.</strong>
            <span>영문·한글·플레이 키워드로 다시 검색해 보세요.</span>
          </div>
        )}
      </div>
    </div>
  )
}
