# Basketball Playbook Lab Design

Date: 2026-07-26

## Goal

Build a new, independent basketball learning application in `Rudwpahs/Basketball`. It must teach 74 terms with visualizations that are spatially and semantically related to each term, using an accurately proportioned NBA half-court and genuine 3D ball motion.

## Product principles

1. Correctness comes before decoration.
2. One world coordinate system controls court, hoop, actors, and ball.
3. A term receives the visual form its meaning requires.
4. A shot outcome is visible in the trajectory and contact events.
5. The 3D court is the primary learning surface; UI supports it instead of competing with it.
6. Every animation can be paused and stepped.

## Information architecture

### Desktop

- Header: product mark, global search, progress, help.
- Left rail: category filters, 74-term index, completion state.
- Centre stage: 3D half-court, term title, camera presets, phase label, transport controls.
- Right rail: Korean definition, why it works, current phase explanation, coach cue, common mistake.
- Quiz sheet: one recall question after a user finishes a term.

### Mobile

- Compact header and search.
- 3D court occupies the first useful viewport.
- Playback controls sit directly below the court.
- Explanation follows in document order.
- The term index opens as a full-height drawer.

## Visual system

- Style: Playbook Neo refined through Swiss editorial structure.
- Background: warm playbook cream.
- Primary surface: ink navy.
- Court: warm hardwood tan with dark navy markings and orange rim.
- Active path and selected controls: signal red.
- Success: green plus icon/text, never colour alone.
- Display: Barlow Condensed 600–700.
- Body: Barlow 400–600.
- Labels/data: IBM Plex Mono 400–500.
- Corners: 0–4 px; avoid pill-heavy generic SaaS styling.
- Motion: 180–240 ms UI transitions; court motion is driven by scenario time and physics.

## Technical architecture

### Stack

- Vite
- React
- TypeScript
- Three.js through `@react-three/fiber`
- `@react-three/drei` for constrained camera controls and reusable primitives
- Vitest for simulation and data-contract tests
- Testing Library for key UI behavior
- Lucide React for interface icons

### Modules

- `src/sim/coordinates.ts`: world units and renderer mapping.
- `src/sim/court.ts`: official NBA constants and derived line geometry.
- `src/sim/ballistics.ts`: projectile solver and path sampling.
- `src/sim/collisions.ts`: rim/backboard clearance and contact classification.
- `src/sim/shots.ts`: deterministic paths for shot outcomes.
- `src/sim/scenario.ts`: timeline evaluation for actor and ball state.
- `src/data/terms.ts`: 74 term records.
- `src/data/scenarios.ts`: term-specific or intentionally shared scenarios.
- `src/scene/*`: court, basket, actors, ball, trail, camera.
- `src/features/learn/*`: search, index, explanation, playback, quiz.

The simulation layer has no React or Three.js dependency. Renderer components consume immutable frame snapshots.

## Coordinate model

- World unit: metre.
- `x`: lateral position, negative left and positive right.
- `y`: distance from the offensive baseline toward midcourt.
- `z`: height above the floor.
- Half-court bounds: `x = ±7.62`, `y = 0…14.3256`.
- Rim centre: `(0, 1.6002, 3.048)`.
- Three-point arc radius: `7.239`.
- Corner line x positions: `±6.7056`.
- Three.js mapping is defined once and used everywhere.

The arc is sampled only on the midcourt side of the rim. Its two endpoints meet the corner lines; this prevents the reversed three-point line defect.

## Visualization modes

Each term declares exactly one mode.

- `play`: coordinated player movement, screens, passes, and shots.
- `skill`: one- or two-player footwork/ball-handling sequence.
- `shot`: 3D trajectory and result-specific contact.
- `court`: relevant zone or line is highlighted without invented play motion.
- `rule`: legal/illegal positions and the state change are shown explicitly.

## Shot model

Supported outcomes:

- `swish`: ball centre clears the rim opening and continues below the rim.
- `front-rim`: first contact occurs on the shooter-facing rim and rebounds away.
- `back-rim`: first contact occurs on the far rim.
- `rim-out`: visible rim contact followed by a miss.
- `bank-make`: backboard contact occurs before a successful rim passage.
- `airball`: no rim or backboard contact; the ball passes outside the legal contact envelope.

Each path exposes sampled positions and semantic events. Rendering reads those positions; it does not create an unrelated CSS path.

## Content model

Every term includes:

- English name and Korean name.
- Category and difficulty.
- Concise Korean definition.
- Why/when the concept is used.
- One coach cue.
- One common mistake.
- Visualization mode and scenario ID.
- One four-option quiz item with explanation.

Scenario reuse is allowed only when the spatial event is genuinely identical. Reused scenarios may not contradict the selected definition.

## Interaction

- Search by English term, Korean term, and keyword.
- Filter by offence, defence, shooting, ball handling, passing, rules, and court.
- Keyboard: `/` focuses search; space toggles playback outside inputs; arrows step phases; `1–3` switch cameras; Escape closes drawers/modals.
- Touch: controls are at least 44 px with 8 px spacing.
- Camera presets: `Coach`, `Top`, `Rim`. Orbit is constrained and resettable.
- Playback: previous phase, play/pause, next phase, 0.5×/1×/1.5×.
- Progress is device-local and optional.

## Performance and accessibility

- Lazy-load the 3D stage bundle.
- Reuse geometries/materials and avoid per-frame allocation.
- Pause rendering when the document is hidden.
- Cap device pixel ratio.
- Provide a text phase log equivalent to the visual animation.
- Respect `prefers-reduced-motion`; autoplay is disabled and ball paths jump between meaningful states.
- Maintain visible focus and WCAG AA contrast.
- Provide a WebGL fallback message without hiding the written lesson.

## Test strategy

### Geometry

- Three-point arc endpoints meet both corner lines.
- Every arc sample lies on the midcourt side of the rim.
- Rim, backboard, free-throw line, restricted area, and court bounds match constants.

### Shots

- A swish crosses the rim plane within the clear opening.
- An airball remains clear of rim and backboard.
- Bank make records backboard contact before rim passage.
- Rim outcomes record the correct first contact.
- Ball height forms a non-flat arc and returns below rim/floor as required.

### Scenarios and content

- Exactly 74 unique term IDs.
- Every term references an existing scenario.
- Visualization mode matches scenario capabilities.
- Shot-related terms use the matching shot outcome.
- Quiz answers and options are valid.

### UI

- Search and filters return the expected terms.
- Playback buttons and keyboard controls change timeline state.
- Reduced-motion preference disables autoplay.
- Mobile drawer and quiz retain focus correctly.

## Delivery

- Source and documentation live in the new `Rudwpahs/Basketball` repository.
- The existing portfolio-embedded implementation is not used as a source.
- The repository receives a complete README with local run, test, build, architecture, and research notes.
