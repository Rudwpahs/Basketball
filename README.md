# Basketball Playbook Lab

농구 용어를 글로만 외우면 실제 코트에서 어떻게 움직이는지 잘 안 남아서 만든 인터랙티브 학습 앱입니다. 하프코트를 3D로 만들고, 슛과 플레이를 실제 좌표 위에서 움직이게 해서 용어를 장면으로 이해하는 데 초점을 맞췄습니다.

현재 74개 농구 용어를 플레이, 개인 기술, 슈팅, 코트 위치, 규칙으로 나눠 볼 수 있습니다.

## 핵심 기능

- NBA 하프코트 규격을 같은 미터 좌표계로 표현
- 스위시, 앞림, 뒷림, 림아웃, 뱅크, 에어볼을 서로 다른 결과로 시뮬레이션
- 용어마다 별도 장면과 단계 재생
- 한글·영문 검색과 7개 분류
- 코치 / 탑 / 림 카메라
- 퀴즈와 브라우저 진도 저장
- `prefers-reduced-motion` 대응

## 좌표 알고리즘

시뮬레이션 계산은 일반적인 3차원 좌표 `(x, y, z)`를 사용하고, Three.js에 넘길 때 한 함수에서만 좌표를 바꿉니다.

```text
시뮬레이션 좌표 (x, y, z)
        ↓
Three.js 좌표 (x, z, -y)
```

이 변환을 한 곳에만 둬서 코트, 공, 림, 선수의 기준축이 서로 달라지는 문제를 막습니다.

주요 규격은 다음과 같습니다.

- 하프코트: `15.24 m × 14.3256 m`
- 림 중심 높이: `3.048 m`
- 3점 원호 반지름: `7.239 m`
- 코너 3점 직선: `x = ±6.7056 m`

## 슛 궤적 알고리즘

기본 비행은 중력가속도 `9.81 m/s²`를 적용한 포물선 운동으로 계산합니다.

```text
릴리즈 위치 + 초기 속도
        ↓
시간 t마다 x/y/z 위치 계산
        ↓
림 / 백보드의 충돌 범위 검사
        ↓
결과별 이벤트 적용
        ↓
made / miss / landing 결정
```

결과 이름만 바꾸는 방식이 아니라 이벤트 자체가 다릅니다.

| 결과 | 이벤트 흐름 |
|---|---|
| Swish | release → rim crossing → made |
| Airball | release → miss → landing, 접촉 없음 |
| Front / Back rim | release → 해당 림 접촉 → miss |
| Rim out | release → rim contact → 바깥 리바운드 |
| Bank make | release → backboard contact → rim crossing → made |

에어볼은 림이나 백보드에 닿지 않아야 하고, 뱅크슛은 백보드 접촉이 먼저 일어나야 합니다. 이런 조건은 테스트로 따로 확인합니다.

## 플레이 재생 방식

각 용어는 하나의 공통 애니메이션을 돌려 쓰지 않습니다.

```text
용어 선택
  ↓
용어가 참조하는 scenario 로드
  ↓
scenario의 단계별 선수 위치 / 공 위치 / 이벤트 계산
  ↓
현재 timeline 위치에 맞는 3D 장면 렌더링
  ↓
사용자 재생·정지·단계 이동에 따라 갱신
```

## 실행

Node.js 22 기준입니다.

```bash
npm ci
npm run dev
```

검증:

```bash
npm test -- --run
npm run typecheck
npm run build
```

## 구조

```text
src/
├── data/       용어, 퀴즈, 시나리오
├── features/   검색, 인덱스, 재생, 해설, 퀴즈, 진도
├── hooks/      접근성 환경 설정
├── scene/      Three.js 코트, 선수, 공, 카메라
├── sim/        규격, 탄도, 충돌, 슛, timeline
└── test/       테스트 설정
```

시뮬레이션 계층은 React와 Three.js를 직접 의존하지 않게 분리해 두었습니다. 그래서 화면을 띄우지 않고도 코트 규격, 충돌, 슛 결과, timeline을 테스트할 수 있습니다.

## 다른 농구 저장소와의 차이

이 저장소는 **농구 개념과 플레이를 3D 장면으로 설명하는 학습·시뮬레이션 프로젝트**입니다.

- `shooting-profile-coach-ios` — FormPath의 슈팅 분석 제품 중심 저장소
- `shooting-form-analysis` — 영상에서 pose를 뽑아 슈팅 동작을 비교하는 분석 실험
- `rudwpahs-basketball` — 개인 프로필과 훈련 기록 관리

비슷한 농구 주제를 다루지만 이 저장소의 목적은 선수 개인 분석이나 훈련 기록 관리가 아니라, **플레이와 규칙을 코트 위 움직임으로 이해하는 것**입니다.

## 참고 자료

- NBA 2025–26 Official Playing Rules
- NBA Rule No. 1 — Court Dimensions & Equipment
- *Using In-Game Shot Trajectories to Better Understand Defensive Impact in the NBA*
- *Kinematic Analysis of Basketball Shooting*
- *Optimal Release Conditions for the Free Throw in Men’s Basketball*

세부 조사 메모는 `docs/research/2026-07-26-basketball-simulator-research.md`, 설계 결정은 `docs/superpowers/specs/2026-07-26-basketball-playbook-lab-design.md`에 있습니다.