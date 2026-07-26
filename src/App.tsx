import {
  BookOpen,
  CheckCircle2,
  Menu,
  Search,
  X,
} from 'lucide-react'
import {
  lazy,
  Suspense,
  useCallback,
  useMemo,
  useState,
} from 'react'
import { SCENARIOS } from './data/scenarios'
import { getTermById, TERMS, type Term } from './data/terms'
import { CameraControls } from './features/learn/CameraControls'
import { LessonPanel } from './features/learn/LessonPanel'
import { PlaybackControls } from './features/learn/PlaybackControls'
import { QuizSheet } from './features/learn/QuizSheet'
import {
  TermIndex,
  type CategoryFilter,
} from './features/learn/TermIndex'
import { useKeyboardShortcuts } from './features/learn/useKeyboardShortcuts'
import { usePlayback } from './features/learn/usePlayback'
import { useProgress } from './features/learn/useProgress'
import type { CameraPreset } from './scene/CameraRig'
import {
  evaluateScenario,
  type Scenario,
} from './sim/scenario'
import { createShotPath } from './sim/shots'
import './styles.css'

const CourtStage = lazy(() =>
  import('./scene/CourtStage').then((module) => ({
    default: module.CourtStage,
  })),
)

function normalise(value: string): string {
  return value.trim().toLocaleLowerCase('ko-KR')
}

function matchesTerm(
  term: Term,
  query: string,
  category: CategoryFilter,
): boolean {
  if (category !== 'all' && term.category !== category) {
    return false
  }
  const target = normalise(query)
  if (!target) {
    return true
  }

  return [
    term.name,
    term.korean,
    term.summary,
    ...term.keywords,
  ].some((value) => normalise(value).includes(target))
}

function getShotTrail(
  scenario: Scenario,
  phaseIndex: number,
) {
  const instruction = scenario.phases[phaseIndex]?.ball
  if (!instruction || instruction.type !== 'shot') {
    return undefined
  }
  const phaseStart = scenario.phases
    .slice(0, phaseIndex)
    .reduce((total, phase) => total + phase.durationMs, 0)
  const frame = evaluateScenario(scenario, phaseStart)
  const shooter = frame.actors[instruction.shooterId]
  if (!shooter) {
    return undefined
  }

  return createShotPath({
    origin: { ...shooter.position, z: 2.1 },
    outcome: instruction.outcome,
  }).points
}

export function App() {
  const progress = useProgress()
  const initialTermId = useMemo(() => {
    try {
      return getTermById(progress.lastTermId).id
    } catch {
      return 'pick-and-roll'
    }
  }, [progress.lastTermId])
  const [selectedId, setSelectedId] = useState(initialTermId)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [camera, setCamera] = useState<CameraPreset>('coach')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [searchInput, setSearchInput] = useState<HTMLInputElement | null>(
    null,
  )
  const term = getTermById(selectedId)
  const scenario = SCENARIOS[term.scenarioId]
  const playback = usePlayback(scenario)
  const filteredTerms = useMemo(
    () =>
      TERMS.filter((candidate) =>
        matchesTerm(candidate, query, category),
      ),
    [category, query],
  )
  const trail = useMemo(() => {
    return getShotTrail(scenario, playback.frame.phaseIndex)
  }, [playback.frame.phaseIndex, scenario])

  const selectTerm = (id: string) => {
    setSelectedId(id)
    progress.selectTerm(id)
    setDrawerOpen(false)
    setQuizOpen(false)
  }

  const closeDrawer = useCallback(() => setDrawerOpen(false), [])
  const closeQuiz = useCallback(() => setQuizOpen(false), [])

  useKeyboardShortcuts({
    searchInput,
    drawerOpen,
    onTogglePlayback: playback.togglePlayback,
    onPrevious: playback.previousPhase,
    onNext: playback.nextPhase,
    onCameraChange: setCamera,
    onCloseDrawer: closeDrawer,
    onCloseQuiz: closeQuiz,
  })

  const termIndex = (
    <TermIndex
      terms={filteredTerms}
      allTerms={TERMS}
      selectedId={selectedId}
      category={category}
      query={query}
      completedIds={progress.completedIds}
      onCategoryChange={setCategory}
      onSelect={selectTerm}
    />
  )

  return (
    <main className="app-shell" aria-label="Basketball Playbook Lab">
      <a className="skip-link" href="#court-workstation">
        코트 학습 화면으로 건너뛰기
      </a>

      <header className="topbar">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            B
          </span>
          <div>
            <strong>BASKETBALL</strong>
            <span>PLAYBOOK LAB</span>
          </div>
        </div>

        <label className="global-search">
          <span className="sr-only">농구 용어 검색</span>
          <Search size={18} aria-hidden="true" />
          <input
            ref={setSearchInput}
            type="search"
            value={query}
            placeholder="용어, 움직임, 규칙 검색"
            aria-label="농구 용어 검색"
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
          <kbd>/</kbd>
        </label>

        <div className="topbar__progress" aria-label="학습 진행률">
          <CheckCircle2 size={18} aria-hidden="true" />
          <span>
            <strong>{progress.completedIds.size}</strong> / {TERMS.length}
          </span>
        </div>

        <button
          type="button"
          className="mobile-menu-button"
          aria-label="플레이북 열기"
          onClick={() => setDrawerOpen(true)}
        >
          <Menu size={21} aria-hidden="true" />
          <span>INDEX</span>
        </button>
      </header>

      <div className="workspace">
        <aside className="term-rail" aria-label="농구 용어 플레이북">
          <div className="rail-heading">
            <BookOpen size={17} aria-hidden="true" />
            <span>PLAYBOOK INDEX</span>
          </div>
          {termIndex}
        </aside>

        <section
          className="court-workstation"
          id="court-workstation"
          aria-label={`${term.name} 3D 플레이`}
        >
          <div className="court-toolbar">
            <div>
              <span>LIVE COURT</span>
              <strong>{term.korean}</strong>
            </div>
            <CameraControls value={camera} onChange={setCamera} />
          </div>

          <Suspense
            fallback={
              <div className="court-loading" role="status">
                3D 코트 준비 중…
              </div>
            }
          >
            <CourtStage
              frame={playback.frame}
              highlight={scenario.highlight}
              cameraPreset={camera}
              trail={trail}
            />
          </Suspense>

          <PlaybackControls
            scenario={scenario}
            frame={playback.frame}
            playing={playback.playing}
            speed={playback.speed}
            reducedMotion={playback.reducedMotion}
            onPrevious={playback.previousPhase}
            onToggle={playback.togglePlayback}
            onNext={playback.nextPhase}
            onSeek={playback.seek}
            onSpeedChange={playback.setSpeed}
            onPhaseChange={playback.goToPhase}
          />
        </section>

        <aside className="lesson-rail" aria-label="용어 해설">
          <LessonPanel
            term={term}
            frame={playback.frame}
            completed={progress.completedIds.has(term.id)}
            onOpenQuiz={() => setQuizOpen(true)}
          />
        </aside>
      </div>

      {drawerOpen ? (
        <div className="drawer-backdrop" onMouseDown={closeDrawer}>
          <aside
            className="mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="농구 용어 플레이북"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <strong>PLAYBOOK INDEX</strong>
              <button
                type="button"
                className="icon-button icon-button--light"
                aria-label="플레이북 닫기"
                onClick={closeDrawer}
                autoFocus
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>
            {termIndex}
          </aside>
        </div>
      ) : null}

      <QuizSheet
        term={term}
        open={quizOpen}
        onClose={closeQuiz}
        onComplete={progress.completeTerm}
      />
    </main>
  )
}
