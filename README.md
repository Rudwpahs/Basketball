# Basketball Playbook Lab

정확한 NBA 하프코트와 실제 3차원 공 궤적을 중심으로 74개 농구 용어를 배우는 인터랙티브 웹앱입니다.

이 프로젝트는 기존 Base44 앱이나 포트폴리오 내부 구현을 복사하지 않고, `Rudwpahs/Basketball`을 위한 독립 코드베이스로 새로 설계했습니다.

## 무엇이 다른가

- **공식 코트 좌표**: 코트, 3점 라인, 백보드, 림, 선수, 공이 모두 같은 미터 단위 좌표계를 사용합니다.
- **올바른 3점 라인**: 원호가 림을 중심으로 미드코트 방향에 놓이며 양쪽 코너 직선과 정확히 연결됩니다.
- **결과가 다른 슛**: 스위시, 프런트림, 백림, 림아웃, 뱅크 메이크, 에어볼이 서로 다른 물리 경로와 접촉 이벤트를 가집니다.
- **접촉 없는 에어볼**: 에어볼은 림과 백보드의 충돌 범위를 모두 벗어납니다.
- **용어별 장면**: 플레이, 개인 기술, 슈팅, 코트 위치, 규칙을 하나의 가짜 애니메이션으로 돌려 쓰지 않습니다.
- **실제 3D 표현**: 원근 카메라, 높이가 있는 선수·공·골대, 동적 공 그림자, 궤적 트레일을 사용합니다.
- **완전한 학습 흐름**: 한글·영문 검색, 7개 분류, 단계 재생, 3개 카메라, 코치 포인트, 오답 포인트, 퀴즈, 로컬 진도 저장을 제공합니다.

## 실행

요구 사항: Node.js 22

```bash
npm ci
npm run dev
```

프로덕션 검증:

```bash
npm test -- --run
npm run typecheck
npm run build
```

## 조작

| 입력 | 동작 |
|---|---|
| `/` | 검색창 포커스 |
| `Space` | 재생/일시정지 |
| `←` / `→` | 이전/다음 단계 |
| `1` / `2` / `3` | 코치/탑/림 카메라 |
| `Esc` | 퀴즈 또는 모바일 인덱스 닫기 |
| 드래그/핀치 | 제한된 범위에서 3D 코트 회전/확대 |

`prefers-reduced-motion`이 켜져 있으면 자동 재생과 연속 카메라 이동을 끄고 핵심 장면 단위로 이동합니다.

## 좌표와 규격

월드 좌표의 단위는 미터입니다.

- `x`: 좌우
- `y`: 공격 베이스라인에서 미드코트 방향
- `z`: 바닥에서의 높이
- 하프코트: `15.24 m × 14.3256 m`
- 림 중심: `(0, 1.6002, 3.048)`
- 3점 원호 반지름: `7.239 m`
- 코너 3점 직선: `x = ±6.7056 m`
- 림 내측 반지름: `0.2286 m`

Three.js 장면에서는 한 곳의 변환 함수가 `(x, y, z) → (x, z, -y)`를 적용합니다. 코트와 슛이 서로 다른 기준으로 그려지는 문제를 구조적으로 막습니다.

## 슛 모델

기본 비행은 중력가속도 `9.81 m/s²`의 포물선 운동으로 계산합니다. 각 결과는 샘플 좌표뿐 아니라 의미 이벤트도 노출합니다.

| 결과 | 이벤트 |
|---|---|
| Swish | release → rim crossing → made |
| Airball | release → miss → landing, rim/board contact 없음 |
| Front/Back rim | release → 해당 림 접촉 → miss |
| Rim out | release → 림 접촉 → 바깥 리바운드 |
| Bank make | release → backboard contact → rim crossing → made |

## 구조

```text
src/
├── data/       74개 용어, 퀴즈, 용어별 시나리오
├── features/   검색, 인덱스, 재생, 해설, 퀴즈, 진도
├── hooks/      접근성 환경 설정
├── scene/      Three.js 코트, 골대, 선수, 공, 카메라
├── sim/        좌표, 코트 규격, 탄도, 충돌, 슛, 타임라인
└── test/       공통 테스트 설정
```

시뮬레이션 계층은 React와 Three.js를 의존하지 않습니다. 따라서 코트 규격, 충돌, 슛 결과, 플레이 타임라인을 화면과 별개로 테스트할 수 있습니다.

## 정확성 검증

테스트는 다음 결함을 직접 막습니다.

- 3점 원호의 양 끝이 코너 직선과 만나는지
- 원호 전체가 림의 미드코트 쪽에 있는지
- 림과 백보드의 실제 높이·위치가 규격과 일치하는지
- 공이 평면 직선이 아니라 상승·하강하는지
- 스위시가 림 내부를 통과하는지
- 에어볼이 림과 백보드에 닿지 않는지
- 뱅크슛이 백보드에 먼저 닿는지
- 크로스오버 공이 바운드하며 몸의 반대편으로 이동하는지
- 정확히 74개 고유 용어가 존재하고 각 용어가 호환되는 시나리오를 참조하는지
- 검색, 단계 이동, 모바일 인덱스, 퀴즈, 진도 복원이 동작하는지

## 자료 근거

- [NBA 2025–26 Official Playing Rules](https://cdn.nba.com/manage/2026/01/Official-2025-26-NBA-Playing-Rules.pdf)
- [NBA Rule No. 1 — Court Dimensions & Equipment](https://official.nba.com/rule-no-1-court-dimensions-equipment/)
- [Using In-Game Shot Trajectories to Better Understand Defensive Impact in the NBA](https://arxiv.org/pdf/1905.00822)
- [Kinematic Analysis of Basketball Shooting](https://doi.org/10.3390/ijerph18030934)
- [Optimal Release Conditions for the Free Throw in Men’s Basketball](https://arxiv.org/abs/1702.07234)
- [Exploring the Design Space of Interactive Sports Visualizations](https://doi.org/10.1145/3491102.3502078)

세부 조사 메모는 [`docs/research/2026-07-26-basketball-simulator-research.md`](docs/research/2026-07-26-basketball-simulator-research.md), 설계 결정은 [`docs/superpowers/specs/2026-07-26-basketball-playbook-lab-design.md`](docs/superpowers/specs/2026-07-26-basketball-playbook-lab-design.md)에 있습니다.
