# Basketball Simulator Research

Date: 2026-07-26

## 1. Court and equipment geometry

The simulator uses NBA dimensions as its single geometry standard.

- Court: 94 ft × 50 ft; the app displays the offensive half.
- Backboard plane: 4 ft from the baseline.
- Rim centre: 5.25 ft from the baseline, with the top edge 10 ft above the floor.
- Rim: 18 in inside diameter.
- Three-point arc: 23 ft 9 in from the centre of the basket.
- Corner three: parallel lines 3 ft from each sideline.
- Free-throw line: 15 ft from the face of the backboard.
- Restricted area: 4 ft radius from the centre of the rim.

Primary sources:

- [2025–26 NBA Official Playing Rules](https://cdn.nba.com/manage/2026/01/Official-2025-26-NBA-Playing-Rules.pdf)
- [NBA Rule No. 1: Court Dimensions—Equipment](https://official.nba.com/rule-no-1-court-dimensions-equipment/)

Implementation consequence: the three-point arc is centred on the rim and opens toward midcourt. The corner segments begin at the baseline and meet the forward-facing arc. Court lines, actors, hoop, and ball all use metres in the same world coordinate system.

## 2. Shot trajectory and outcome

Basketball shot quality cannot be represented by a 2D line between shooter and basket. Tracking research models a shot with spatial trajectory factors including entry angle, depth, and left-right accuracy. Biomechanics research also shows that release and entry angles vary with shot distance.

Sources:

- [Using In-Game Shot Trajectories to Better Understand Player Shooting Ability](https://arxiv.org/pdf/1905.00822)
- [Kinematic Analysis of 2-Point and 3-Point Jump Shot](https://doi.org/10.3390/ijerph18030934)
- [The physics of an optimal basketball free throw](https://arxiv.org/abs/1702.07234)

Implementation consequence:

- Position is represented as lateral `x`, baseline distance `y`, and height `z`.
- Direct-flight segments use a ballistic equation under gravity.
- A shot result is derived from its relationship to the rim and backboard, not from a disconnected success label.
- `swish`, `front-rim`, `back-rim`, `rim-out`, `bank-make`, and `airball` have distinct paths and contact events.
- An airball must maintain clearance from both rim and backboard.
- The visible ball shadow remains on the court plane and changes scale/opacity with height so depth is legible.

## 3. Learning and sports visualization

Interactive court visualizations make complex basketball data and events more comprehensible when the court is used as the stable spatial reference. Research on basketball visual search also indicates that learners benefit from focusing on the informative parts of a play rather than scanning unnecessary motion.

Sources:

- [Supporting Data-Driven Basketball Journalism through Interactive Visualization](https://doi.org/10.1145/3491102.3502078)
- [Research on visual search behaviors of basketball players at different levels](https://doi.org/10.1038/s41598-023-28754-2)

Implementation consequence:

- Only the actors relevant to the current phase receive emphasis.
- The explanation identifies the current decision, not merely the current coordinates.
- Users can pause, step backward/forward, change speed, and select a camera preset.
- Terms route to the correct visual form: play, skill, shot, court location, or rule. The app never invents a generic five-player sequence for a term that does not need one.

## 4. UI/UX research synthesis

UI/UX Pro Max was queried for professional sports learning, spatial continuity, accessibility, and Three.js performance.

Selected direction:

- Swiss editorial grid rather than a generic card dashboard.
- Barlow Condensed for display, Barlow for body, IBM Plex Mono for labels.
- Ink navy, playbook cream, hardwood tan, and signal red.
- Desktop: index / court / explanation.
- Mobile: court first, then controls and explanation; term index becomes a drawer.
- Minimum 44 × 44 px touch targets, 8 px separation, visible focus, and 4.5:1 text contrast.
- Reduced-motion mode replaces autoplay with discrete phase changes.
- Three.js geometry is allocated once and the render loop pauses while the tab is hidden.

## 5. Rejected approaches

### Patched SVG

Rejected because it preserves the original root problem: court drawing, actor coordinates, and ball motion remain separate layers with no shared physical model.

### 2.5D canvas

Rejected because it can fake height but makes rim/backboard contact and camera changes difficult to verify.

### True 3D court with a pure TypeScript simulation core

Selected. The 3D renderer makes depth visible; the pure simulation core keeps court geometry, trajectories, contact events, and play interpolation deterministic and testable.
