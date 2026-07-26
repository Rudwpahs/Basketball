# Basketball Playbook Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a research-grounded basketball learning app with an accurate NBA half-court, deterministic 3D shot outcomes, term-specific visualizations, and 74 complete lessons.

**Architecture:** A pure TypeScript simulation core owns world coordinates, court geometry, trajectories, collision events, and scenario timelines. React renders learning controls and `@react-three/fiber` renders immutable simulation snapshots, keeping visual output tied to testable basketball state.

**Tech Stack:** React 19.2.8, TypeScript, Vite 8.1.5, Three.js 0.185.1, React Three Fiber 9.6.1, Drei 10.7.7, Vitest 4.1.10, Testing Library, Lucide React.

## Global Constraints

- NBA dimensions are the only court geometry standard.
- Metres are the only world unit.
- World coordinates are `x` lateral, `y` baseline-to-midcourt, `z` height.
- Court, hoop, players, and ball share the same world coordinate system.
- An airball cannot touch the rim or backboard.
- A term cannot use a scenario that contradicts its definition.
- Exactly 74 unique term IDs ship in the initial release.
- The 3D scene remains usable at 375, 768, 1024, and 1440 px widths.
- Touch targets are at least 44 × 44 px with at least 8 px separation.
- `prefers-reduced-motion` disables autoplay and continuous camera transitions.

---

## File map

- `package.json`, `vite.config.ts`, `tsconfig*.json`: build and test toolchain.
- `src/sim/types.ts`: shared simulation types only.
- `src/sim/coordinates.ts`: world-to-render coordinate mapping.
- `src/sim/court.ts`: official constants and derived court paths.
- `src/sim/ballistics.ts`: projectile solving and sampling.
- `src/sim/collisions.ts`: rim/backboard clearance and event classification.
- `src/sim/shots.ts`: semantic shot outcome trajectories.
- `src/sim/scenario.ts`: deterministic timeline evaluation.
- `src/data/terms.ts`: 74 lessons and quiz data.
- `src/data/scenarios.ts`: visualization scenarios.
- `src/scene/*`: Three.js presentation components.
- `src/features/learn/*`: search, filtering, playback, lesson, quiz, and progress.
- `src/App.tsx`, `src/styles.css`: application composition and visual system.
- `src/**/*.test.ts(x)`: unit and interaction tests beside the behavior they protect.

### Task 1: Project shell and deterministic test harness

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/test/setup.ts`
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces: `npm test`, `npm run build`, and a renderable `<App />`.

- [ ] **Step 1: Write the failing smoke test**

```tsx
it('labels the primary learning surface', () => {
  render(<App />)
  expect(screen.getByRole('main', { name: /basketball playbook lab/i })).toBeVisible()
})
```

- [ ] **Step 2: Run the test to verify RED**

Run: `npm test -- src/App.test.tsx`

Expected: FAIL because the toolchain and `App` do not exist.

- [ ] **Step 3: Add the minimal Vite/React shell**

`App` returns:

```tsx
export function App() {
  return <main aria-label="Basketball Playbook Lab">Loading court…</main>
}
```

- [ ] **Step 4: Install dependencies and verify GREEN**

Run: `npm install --cache /tmp/basketball-npm-cache`

Run: `npm test -- src/App.test.tsx`

Expected: one passing test.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vite.config.ts tsconfig*.json index.html src
git commit -m "build: initialize basketball lab"
```

### Task 2: Official NBA half-court geometry

**Files:**
- Create: `src/sim/types.ts`
- Create: `src/sim/coordinates.ts`
- Create: `src/sim/court.ts`
- Test: `src/sim/court.test.ts`

**Interfaces:**
- Produces: `COURT`, `getThreePointArc()`, `getCornerThreeSegments()`, `toRenderPosition(point)`.

- [ ] **Step 1: Write failing literal geometry tests**

```ts
it('places the three-point arc on the midcourt side of the rim', () => {
  const arc = getThreePointArc(65)
  expect(arc[0].x).toBeCloseTo(-COURT.cornerThreeX, 3)
  expect(arc.at(-1)!.x).toBeCloseTo(COURT.cornerThreeX, 3)
  expect(Math.min(...arc.map((p) => p.y))).toBeGreaterThan(COURT.rim.y)
})

it('joins both corner lines to the arc', () => {
  const arc = getThreePointArc(65)
  const corners = getCornerThreeSegments()
  expect(corners.left.end).toEqual(arc[0])
  expect(corners.right.end).toEqual(arc.at(-1))
})
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/sim/court.test.ts`

Expected: FAIL because court functions do not exist.

- [ ] **Step 3: Implement constants and derived paths**

Use literal metres:

```ts
export const COURT = {
  halfLength: 14.3256,
  halfWidth: 7.62,
  rim: { x: 0, y: 1.6002, z: 3.048 },
  rimInnerRadius: 0.2286,
  ballRadius: 0.1194,
  threePointRadius: 7.239,
  cornerThreeX: 6.7056,
  backboardY: 1.2192,
  freeThrowY: 5.7912,
  restrictedRadius: 1.2192,
} as const
```

Generate `x = r sin θ`, `y = rimY + r cos θ` from `-asin(cornerX/r)` to its positive counterpart.

- [ ] **Step 4: Verify GREEN and mutation cases**

Run: `npm test -- src/sim/court.test.ts`

Then temporarily invert the cosine sign, confirm the first test fails, and restore it.

- [ ] **Step 5: Commit**

```bash
git add src/sim
git commit -m "feat: model official half-court geometry"
```

### Task 3: Ballistics, clearances, and semantic shot outcomes

**Files:**
- Create: `src/sim/ballistics.ts`
- Create: `src/sim/collisions.ts`
- Create: `src/sim/shots.ts`
- Test: `src/sim/ballistics.test.ts`
- Test: `src/sim/shots.test.ts`

**Interfaces:**
- Produces: `solveBallisticArc(input)`, `sampleBallisticArc(solution, count)`, `createShotPath(input)`, `inspectShotPath(path)`.
- `createShotPath` returns `{ points, events, duration, outcome }`.

- [ ] **Step 1: Write a failing height test**

```ts
it('creates a non-flat ballistic arc', () => {
  const path = solveBallisticArc({
    origin: { x: 4.2, y: 8.2, z: 2.15 },
    target: COURT.rim,
    launchAngleDeg: 52,
  })
  const points = sampleBallisticArc(path, 61)
  expect(Math.max(...points.map((p) => p.z))).toBeGreaterThan(4)
  expect(points[30].z).toBeGreaterThan(points[0].z)
})
```

- [ ] **Step 2: Verify RED, implement the projectile solver, verify GREEN**

Use:

```ts
v² = g d² / (2 cos²θ (d tanθ - Δz))
z(t) = z0 + v sinθ t - 0.5 g t²
```

Run: `npm test -- src/sim/ballistics.test.ts`

- [ ] **Step 3: Write failing outcome tests**

```ts
it('keeps an airball clear of rim and backboard', () => {
  const inspection = inspectShotPath(createShotPath({
    origin: { x: 3.8, y: 8, z: 2.1 },
    outcome: 'airball',
  }))
  expect(inspection.rimContacts).toHaveLength(0)
  expect(inspection.backboardContacts).toHaveLength(0)
  expect(inspection.minimumRimClearance).toBeGreaterThan(0)
})

it('records backboard contact before a bank make', () => {
  const shot = createShotPath({
    origin: { x: 3.5, y: 6.8, z: 2.1 },
    outcome: 'bank-make',
  })
  expect(shot.events.map((event) => event.type)).toEqual([
    'release',
    'backboard-contact',
    'rim-crossing',
    'made',
  ])
})
```

- [ ] **Step 4: Verify RED, implement outcomes one at a time, verify GREEN after each**

Order: `swish`, `airball`, `front-rim`, `back-rim`, `rim-out`, `bank-make`.

Run: `npm test -- src/sim/shots.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/sim
git commit -m "feat: add deterministic 3d shot outcomes"
```

### Task 4: Scenario timeline and content contracts

**Files:**
- Create: `src/sim/scenario.ts`
- Create: `src/data/scenarios.ts`
- Create: `src/data/terms.ts`
- Test: `src/sim/scenario.test.ts`
- Test: `src/data/terms.test.ts`

**Interfaces:**
- Produces: `evaluateScenario(scenario, elapsedMs)`.
- Produces: `TERMS`, `SCENARIOS`, `getTermById(id)`.

- [ ] **Step 1: Write failing timeline interpolation tests**

```ts
it('keeps the ball attached to its carrier before a pass', () => {
  const frame = evaluateScenario(SCENARIOS['pick-and-roll'], 200)
  expect(frame.ball.ownerId).toBe('handler')
  expect(frame.ball.position.x).toBeCloseTo(frame.actors.handler.position.x)
})
```

- [ ] **Step 2: Verify RED, implement phase/action interpolation, verify GREEN**

Run: `npm test -- src/sim/scenario.test.ts`

- [ ] **Step 3: Write failing 74-term contract tests**

```ts
it('ships exactly 74 unique complete lessons', () => {
  expect(TERMS).toHaveLength(74)
  expect(new Set(TERMS.map((term) => term.id)).size).toBe(74)
  for (const term of TERMS) {
    expect(SCENARIOS[term.scenarioId]).toBeDefined()
    expect(term.quiz.options).toHaveLength(4)
    expect(term.quiz.options).toContain(term.quiz.answer)
  }
})
```

- [ ] **Step 4: Add terms by visualization group**

Create all required fields for seven groups: offence, defence, shooting, ball handling, passing, rules, court.

- [ ] **Step 5: Verify GREEN and commit**

Run: `npm test -- src/data/terms.test.ts src/sim/scenario.test.ts`

```bash
git add src/data src/sim
git commit -m "feat: add basketball lessons and timelines"
```

### Task 5: Three-dimensional court renderer

**Files:**
- Create: `src/scene/CourtStage.tsx`
- Create: `src/scene/CourtSurface.tsx`
- Create: `src/scene/CourtMarkings.tsx`
- Create: `src/scene/Basket.tsx`
- Create: `src/scene/Actor.tsx`
- Create: `src/scene/Ball.tsx`
- Create: `src/scene/TrajectoryTrail.tsx`
- Create: `src/scene/CameraRig.tsx`
- Test: `src/scene/CourtStage.test.tsx`

**Interfaces:**
- Consumes: `SimulationFrame`, `COURT`, and sampled paths.
- Produces: `<CourtStage frame cameraPreset reducedMotion />`.

- [ ] **Step 1: Write a failing accessible-fallback test**

```tsx
it('keeps a written phase description beside the canvas', () => {
  render(<CourtStage frame={frame} cameraPreset="coach" reducedMotion />)
  expect(screen.getByRole('img', { name: frame.a11yDescription })).toBeVisible()
})
```

- [ ] **Step 2: Verify RED and build the stage**

Use a single `<Canvas>` with capped DPR, ambient/key lights, constrained camera presets, and reusable geometry. Map every world point through `toRenderPosition`.

- [ ] **Step 3: Add sphere ball, dynamic floor shadow, hoop, board, actors, and trail**

The ball mesh uses `COURT.ballRadius`; its floor shadow derives from the same `x/y` position and the current `z` height.

- [ ] **Step 4: Verify GREEN and commit**

Run: `npm test -- src/scene/CourtStage.test.tsx`

```bash
git add src/scene
git commit -m "feat: render the interactive 3d court"
```

### Task 6: Learning workstation UI

**Files:**
- Create: `src/features/learn/usePlayback.ts`
- Create: `src/features/learn/TermIndex.tsx`
- Create: `src/features/learn/PlaybackControls.tsx`
- Create: `src/features/learn/LessonPanel.tsx`
- Create: `src/features/learn/CameraControls.tsx`
- Create: `src/features/learn/QuizSheet.tsx`
- Create: `src/features/learn/useKeyboardShortcuts.ts`
- Modify: `src/App.tsx`
- Create: `src/styles.css`
- Test: `src/features/learn/LearningWorkspace.test.tsx`

**Interfaces:**
- Produces the complete search → play → explain → quiz loop.

- [ ] **Step 1: Write failing search and playback tests**

```tsx
it('finds a Korean term and opens its lesson', async () => {
  render(<App />)
  await user.type(screen.getByRole('searchbox'), '에어볼')
  await user.click(screen.getByRole('button', { name: /airball/i }))
  expect(screen.getByRole('heading', { name: /airball/i })).toBeVisible()
})
```

- [ ] **Step 2: Verify RED and implement the desktop workstation**

Build the three-column layout using the design-system tokens. Keep the court visually dominant.

- [ ] **Step 3: Add mobile drawer and breakpoint behavior**

At widths below 900 px, collapse the index and place the court before written content.

- [ ] **Step 4: Add keyboard, touch, and reduced-motion behavior**

Ensure `/`, space, arrows, `1–3`, and Escape follow the design spec. All icon buttons receive accessible names.

- [ ] **Step 5: Verify GREEN and commit**

Run: `npm test -- src/features/learn/LearningWorkspace.test.tsx`

```bash
git add src
git commit -m "feat: build the playbook learning workflow"
```

### Task 7: Content accuracy, quiz flow, and progress

**Files:**
- Modify: `src/data/terms.ts`
- Modify: `src/data/scenarios.ts`
- Create: `src/features/learn/useProgress.ts`
- Test: `src/data/content-accuracy.test.ts`
- Test: `src/features/learn/useProgress.test.ts`

**Interfaces:**
- Produces complete lesson content and device-local completion state.

- [ ] **Step 1: Add semantic regression tests**

```ts
it('maps airball to a no-contact shot scenario', () => {
  const term = getTermById('airball')
  const scenario = SCENARIOS[term.scenarioId]
  expect(scenario.mode).toBe('shot')
  expect(scenario.shotOutcome).toBe('airball')
})
```

- [ ] **Step 2: Verify RED, audit every scenario mapping, verify GREEN**

Run: `npm test -- src/data/content-accuracy.test.ts`

- [ ] **Step 3: Add quiz completion and local progress tests**

Persist only completed term IDs and the last selected term. Handle malformed storage by returning an empty state.

- [ ] **Step 4: Verify GREEN and commit**

```bash
git add src/data src/features
git commit -m "feat: complete lessons quizzes and progress"
```

### Task 8: Final verification and documentation

**Files:**
- Create: `README.md`
- Create: `.gitignore`
- Modify: documentation when verification reveals discrepancies.

**Interfaces:**
- Produces a reproducible repository and verification record.

- [ ] **Step 1: Run the complete automated suite**

Run: `npm test -- --run`

Expected: zero failures and no unhandled warnings.

- [ ] **Step 2: Run type-check and production build**

Run: `npm run typecheck`

Run: `npm run build`

Expected: both exit 0.

- [ ] **Step 3: Run the UI/UX checklist**

Verify 375, 768, 1024, and 1440 px layouts; keyboard navigation; 44 px touch targets; visible focus; reduced motion; no horizontal overflow; and no geometry allocation in the frame loop.

- [ ] **Step 4: Verify the original defects directly**

Confirm:

- The three-point arc opens toward midcourt.
- Hoop and shot target use the same world coordinate.
- The ball visibly rises and falls in 3D.
- Airball misses rim and backboard.
- Bank make touches board before entering.
- Each selected term displays a related scenario.

- [ ] **Step 5: Write README and commit**

```bash
git add README.md .gitignore docs src package*.json vite.config.ts tsconfig*.json index.html
git commit -m "docs: add setup architecture and verification"
```

### Task 9: Publish the verified source to GitHub

**Files:**
- No new production files.

**Interfaces:**
- Produces the initial `main` source state in `Rudwpahs/Basketball`.

- [ ] **Step 1: Confirm scope**

Run: `git status -sb`

Run: `git log --oneline --decorate -10`

Expected: only the new Basketball project and a clean worktree.

- [ ] **Step 2: Create the remote root commit through the GitHub connector**

Because the repository is empty and `gh` is not installed, create the initial file on `main` through the connected GitHub app, then upload the verified tree as a follow-up commit.

- [ ] **Step 3: Verify the remote repository**

Fetch `package.json`, `README.md`, and the final commit metadata through the GitHub app. Confirm the repository file contents match the locally tested state.
