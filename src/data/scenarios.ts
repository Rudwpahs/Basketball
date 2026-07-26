import type {
  ActorSpec,
  BallMotion,
  CourtHighlight,
  Scenario,
  ScenarioPhase,
} from '../sim/scenario'
import type { ShotOutcome } from '../sim/shots'
import type { Point3 } from '../sim/types'

const p = (x: number, y: number, z = 0): Point3 => ({ x, y, z })

function actor(
  id: string,
  label: string,
  number: number,
  team: 'offense' | 'defense',
  start: Point3,
): ActorSpec {
  return { id, label, number, team, start }
}

function basePlayActors(): ActorSpec[] {
  return [
    actor('handler', '볼 핸들러', 1, 'offense', p(-2.8, 8)),
    actor('screener', '스크리너', 5, 'offense', p(0.4, 4.9)),
    actor('wing', '윙', 3, 'offense', p(5.2, 7.2)),
    actor('corner', '코너', 2, 'offense', p(-5.7, 2.5)),
    actor('big', '빅맨', 4, 'offense', p(0.5, 3.1)),
    actor('onball', '온볼 수비', 7, 'defense', p(-2.35, 7.35)),
    actor('helper', '헬프 수비', 8, 'defense', p(0.8, 3.8)),
  ]
}

type PlayConfig = Readonly<{
  id: string
  title: string
  setupDescription: string
  actionLabel: string
  actionDescription: string
  actionPositions: Readonly<Record<string, Point3>>
  initialOwner?: string
  pass?: Readonly<{
    fromId: string
    toId: string
    label: string
    description: string
    style?: 'direct' | 'bounce' | 'lob'
    arcHeight?: number
    positions?: Readonly<Record<string, Point3>>
  }>
  finish?: Readonly<{
    shooterId: string
    label: string
    description: string
    outcome?: ShotOutcome
    positions?: Readonly<Record<string, Point3>>
  }>
  finalDescription?: string
}>

function makePlayScenario(config: PlayConfig): Scenario {
  const initialOwner = config.initialOwner ?? 'handler'
  const phases: ScenarioPhase[] = [
    {
      id: 'read',
      label: 'READ',
      description: config.setupDescription,
      durationMs: 700,
      ball: { type: 'owned', ownerId: initialOwner },
      focusActorIds: [initialOwner],
    },
    {
      id: 'action',
      label: config.actionLabel,
      description: config.actionDescription,
      durationMs: 1050,
      positions: config.actionPositions,
      ball: { type: 'owned', ownerId: initialOwner },
      focusActorIds: Object.keys(config.actionPositions),
    },
  ]

  if (config.pass) {
    phases.push({
      id: 'connect',
      label: config.pass.label,
      description: config.pass.description,
      durationMs: 800,
      positions: config.pass.positions,
      ball: {
        type: 'pass',
        fromId: config.pass.fromId,
        toId: config.pass.toId,
        style: config.pass.style,
        arcHeight: config.pass.arcHeight,
      },
      focusActorIds: [config.pass.fromId, config.pass.toId],
    })
  }

  if (config.finish) {
    phases.push({
      id: 'finish',
      label: config.finish.label,
      description: config.finish.description,
      durationMs: 1400,
      positions: config.finish.positions,
      ball: {
        type: 'shot',
        shooterId: config.finish.shooterId,
        outcome: config.finish.outcome ?? 'swish',
      },
      focusActorIds: [config.finish.shooterId],
    })
  } else {
    phases.push({
      id: 'contain',
      label: 'CONTAIN',
      description:
        config.finalDescription ??
        '수비 간격을 유지하고 다음 패스와 돌파를 동시에 견제합니다.',
      durationMs: 900,
      ball: { type: 'owned', ownerId: initialOwner },
      focusActorIds: ['onball', 'helper'],
    })
  }

  return {
    id: config.id,
    title: config.title,
    mode: 'play',
    actors: basePlayActors(),
    phases,
    shotOutcome: config.finish?.outcome ?? (config.finish ? 'swish' : undefined),
  }
}

const giveAndGo: Scenario = {
  id: 'give-and-go',
  title: 'Give & Go',
  mode: 'play',
  actors: basePlayActors(),
  phases: [
    {
      id: 'ready',
      label: 'READ',
      description: '핸들러가 윙 수비의 시선과 패스 각도를 확인합니다.',
      durationMs: 700,
      ball: { type: 'owned', ownerId: 'handler' },
      focusActorIds: ['handler', 'wing'],
    },
    {
      id: 'give',
      label: 'GIVE',
      description: '핸들러가 윙에게 패스하고 즉시 수비의 등 뒤를 공격합니다.',
      durationMs: 800,
      ball: {
        type: 'pass',
        fromId: 'handler',
        toId: 'wing',
        arcHeight: 1,
      },
      focusActorIds: ['handler', 'wing'],
    },
    {
      id: 'go',
      label: 'GO',
      description: '패스한 선수가 멈추지 않고 림을 향해 직선으로 컷합니다.',
      durationMs: 950,
      positions: { handler: p(-0.6, 2.7), wing: p(4.8, 6.7) },
      ball: { type: 'owned', ownerId: 'wing' },
      focusActorIds: ['handler', 'wing'],
    },
    {
      id: 'return',
      label: 'RETURN',
      description: '윙이 컷 타이밍에 맞춰 바운드 패스를 되돌려 줍니다.',
      durationMs: 760,
      ball: {
        type: 'pass',
        fromId: 'wing',
        toId: 'handler',
        style: 'bounce',
      },
      focusActorIds: ['handler', 'wing'],
    },
    {
      id: 'finish',
      label: 'FINISH',
      description: '커터가 림 앞에서 패스를 받아 마무리합니다.',
      durationMs: 1250,
      ball: { type: 'shot', shooterId: 'handler', outcome: 'bank-make' },
      focusActorIds: ['handler'],
    },
  ],
  shotOutcome: 'bank-make',
}

const offensePlays = [
  makePlayScenario({
    id: 'pick-and-roll',
    title: 'Pick & Roll',
    setupDescription: '핸들러는 스크리너의 각도와 헬프 수비 위치를 읽습니다.',
    actionLabel: 'SCREEN',
    actionDescription: '스크리너가 수비수의 진행 경로에 합법적인 스크린을 세웁니다.',
    actionPositions: {
      handler: p(-1.1, 6.4),
      screener: p(-1.75, 6.9),
      onball: p(-2.0, 6.55),
    },
    pass: {
      fromId: 'handler',
      toId: 'screener',
      label: 'ROLL',
      description: '스크리너가 림으로 롤하고 핸들러가 포켓 패스를 넣습니다.',
      style: 'bounce',
      positions: { handler: p(0.2, 5.2), screener: p(0, 2.8) },
    },
    finish: {
      shooterId: 'screener',
      label: 'FINISH',
      description: '롤맨이 헬프 수비보다 먼저 림에 도착해 마무리합니다.',
      outcome: 'bank-make',
    },
  }),
  makePlayScenario({
    id: 'pick-and-pop',
    title: 'Pick & Pop',
    setupDescription: '슈팅 가능한 빅맨이 스크린 뒤 공간을 확인합니다.',
    actionLabel: 'SCREEN',
    actionDescription: '핸들러가 스크린을 사용해 두 수비수를 페인트로 끌어당깁니다.',
    actionPositions: {
      handler: p(-0.7, 5.7),
      screener: p(-1.5, 6.7),
      onball: p(-1.4, 5.9),
      helper: p(-0.2, 3.5),
    },
    pass: {
      fromId: 'handler',
      toId: 'screener',
      label: 'POP',
      description: '스크리너가 림 대신 빈 엘보 밖으로 팝합니다.',
      positions: { screener: p(2.4, 6.1) },
    },
    finish: {
      shooterId: 'screener',
      label: 'SET SHOT',
      description: '팝한 빅맨이 발을 정렬하고 열린 점프슛을 시도합니다.',
    },
  }),
  makePlayScenario({
    id: 'backdoor-cut',
    title: 'Backdoor Cut',
    setupDescription: '윙 수비가 패스 라인을 과하게 막는 순간을 기다립니다.',
    actionLabel: 'SELL',
    actionDescription: '윙이 공을 받으러 나오는 척해 수비를 위로 끌어냅니다.',
    actionPositions: { wing: p(5.5, 8.2), onball: p(-2.0, 7.2) },
    pass: {
      fromId: 'handler',
      toId: 'wing',
      label: 'BACK CUT',
      description: '윙이 방향을 바꿔 수비 등 뒤로 컷하고 패스를 받습니다.',
      style: 'bounce',
      positions: { wing: p(4.3, 2.3) },
    },
    finish: {
      shooterId: 'wing',
      label: 'FINISH',
      description: '백도어 커터가 백보드를 활용해 마무리합니다.',
      outcome: 'bank-make',
    },
  }),
  makePlayScenario({
    id: 'drive-and-kick',
    title: 'Drive & Kick',
    setupDescription: '코너 슈터가 넓게 서서 도움수비를 선택하게 만듭니다.',
    actionLabel: 'DRIVE',
    actionDescription: '핸들러가 페인트를 침투해 헬프 수비를 림 쪽으로 당깁니다.',
    actionPositions: {
      handler: p(0.5, 3.2),
      helper: p(0.7, 2.9),
      corner: p(5.8, 2.2),
    },
    pass: {
      fromId: 'handler',
      toId: 'corner',
      label: 'KICK',
      description: '헬프 수비가 들어온 순간 코너로 패스를 빼냅니다.',
      positions: { corner: p(5.75, 2.45) },
    },
    finish: {
      shooterId: 'corner',
      label: 'CORNER 3',
      description: '코너 슈터가 캐치와 동시에 발을 정렬해 슛합니다.',
    },
  }),
  makePlayScenario({
    id: 'isolation',
    title: 'Isolation',
    setupDescription: '나머지 네 선수가 반대편으로 비워 1대1 공간을 만듭니다.',
    actionLabel: 'CLEAR',
    actionDescription: '핸들러가 수비의 앞발을 읽고 넓은 중앙 공간을 공격합니다.',
    actionPositions: {
      wing: p(5.8, 8.4),
      corner: p(5.9, 2.4),
      screener: p(-5.4, 7.8),
      big: p(-5.6, 3),
      handler: p(0, 5.2),
      onball: p(0.4, 4.8),
    },
    finish: {
      shooterId: 'handler',
      label: 'CREATE',
      description: '핸들러가 한 번의 방향 전환으로 공간을 만들고 점프슛을 시도합니다.',
    },
  }),
  makePlayScenario({
    id: 'fast-break',
    title: 'Fast Break',
    setupDescription: '리바운드 직후 볼과 두 윙이 세 개의 레인을 나눠 달립니다.',
    actionLabel: 'LANES',
    actionDescription: '핸들러는 중앙, 윙은 사이드라인을 따라 수비보다 먼저 전진합니다.',
    actionPositions: {
      handler: p(0, 5.6),
      wing: p(4.6, 3.7),
      corner: p(-4.8, 3.9),
      onball: p(0.6, 4.8),
    },
    pass: {
      fromId: 'handler',
      toId: 'wing',
      label: 'ADVANCE',
      description: '수비가 볼을 막는 순간 앞선 윙에게 전진 패스를 보냅니다.',
      style: 'lob',
      arcHeight: 1.5,
      positions: { wing: p(3.2, 2.1) },
    },
    finish: {
      shooterId: 'wing',
      label: 'FINISH',
      description: '윙이 수비가 정렬되기 전에 림을 공략합니다.',
      outcome: 'bank-make',
    },
  }),
  makePlayScenario({
    id: 'secondary-break',
    title: 'Secondary Break',
    setupDescription: '첫 속공이 막혀도 뒤따르는 빅맨과 윙이 간격을 유지합니다.',
    actionLabel: 'FLOW',
    actionDescription: '트레일러가 탑으로 들어오고 핸들러는 윙으로 흐릅니다.',
    actionPositions: {
      handler: p(4.4, 6),
      screener: p(0, 7),
      wing: p(-4.7, 5.7),
    },
    pass: {
      fromId: 'handler',
      toId: 'screener',
      label: 'TRAIL',
      description: '트레일러에게 볼을 연결해 정돈되지 않은 수비를 다시 공격합니다.',
    },
    finish: {
      shooterId: 'screener',
      label: 'TRAIL 3',
      description: '트레일러가 수비 간격이 벌어진 틈에서 슛합니다.',
    },
  }),
  makePlayScenario({
    id: 'handoff',
    title: 'Dribble Handoff',
    setupDescription: '핸들러와 윙이 어깨가 스칠 정도의 간격으로 접근합니다.',
    actionLabel: 'HANDOFF',
    actionDescription: '핸들러가 몸으로 수비를 가리며 윙에게 공을 건넵니다.',
    actionPositions: {
      handler: p(1.5, 6),
      wing: p(1.8, 6.2),
      onball: p(0.9, 5.8),
    },
    pass: {
      fromId: 'handler',
      toId: 'wing',
      label: 'TURN',
      description: '공을 받은 윙이 핸드오프 제공자의 어깨를 타고 코너를 돕니다.',
      positions: { wing: p(0.5, 4.2), handler: p(1.7, 5.8) },
    },
    finish: {
      shooterId: 'wing',
      label: 'PULL-UP',
      description: '수비가 뒤처진 공간에서 균형을 잡고 풀업 점프슛을 시도합니다.',
    },
  }),
  makePlayScenario({
    id: 'high-low',
    title: 'High–Low',
    setupDescription: '하이포스트와 로우포스트 빅맨이 같은 세로선에 서지 않습니다.',
    initialOwner: 'screener',
    actionLabel: 'SEAL',
    actionDescription: '로우포스트 빅맨이 수비를 등지고 림 쪽 공간을 봉쇄합니다.',
    actionPositions: {
      screener: p(0.7, 5.6),
      big: p(-0.5, 2.4),
      helper: p(-0.4, 3),
    },
    pass: {
      fromId: 'screener',
      toId: 'big',
      label: 'HIGH–LOW',
      description: '하이포스트가 수비 손 위로 로우포스트에 패스를 넣습니다.',
      style: 'lob',
      arcHeight: 1.5,
    },
    finish: {
      shooterId: 'big',
      label: 'POWER FINISH',
      description: '실링한 빅맨이 몸을 열어 림 가까이에서 마무리합니다.',
      outcome: 'bank-make',
    },
  }),
  makePlayScenario({
    id: 'horns-set',
    title: 'Horns Set',
    setupDescription: '두 빅맨이 양쪽 엘보에, 두 슈터가 코너에 배치됩니다.',
    actionLabel: 'CHOOSE',
    actionDescription: '핸들러가 더 유리한 쪽 엘보 스크린을 선택합니다.',
    actionPositions: {
      screener: p(-2.1, 5.8),
      big: p(2.1, 5.8),
      handler: p(-1.3, 5.2),
      corner: p(-5.8, 2.2),
      wing: p(5.8, 2.2),
    },
    pass: {
      fromId: 'handler',
      toId: 'big',
      label: 'SHORT ROLL',
      description: '반대 엘보 빅맨에게 패스해 중앙의 수적 우위를 만듭니다.',
      positions: { big: p(1.1, 4.1) },
    },
    finish: {
      shooterId: 'big',
      label: 'ELBOW SHOT',
      description: '빅맨이 헬프가 늦으면 엘보 점퍼를 선택합니다.',
    },
  }),
  makePlayScenario({
    id: 'five-out-motion',
    title: '5-Out Motion',
    setupDescription: '다섯 공격수가 페인트를 비우고 3점선 바깥 간격을 유지합니다.',
    actionLabel: 'PASS & CUT',
    actionDescription: '패스한 선수는 멈추지 않고 림으로 컷해 빈 공간을 만듭니다.',
    actionPositions: {
      handler: p(-0.8, 4),
      screener: p(-4.5, 7),
      big: p(4.4, 7),
      wing: p(5.6, 2.3),
      corner: p(-5.6, 2.3),
    },
    pass: {
      fromId: 'handler',
      toId: 'wing',
      label: 'FILL',
      description: '다음 선수가 빈 자리를 채우며 볼과 사람을 계속 이동시킵니다.',
      positions: { handler: p(0, 2.5), wing: p(5.4, 3.2) },
    },
    finish: {
      shooterId: 'wing',
      label: 'OPEN 3',
      description: '회전이 늦은 수비를 상대로 열린 3점슛을 선택합니다.',
    },
  }),
  makePlayScenario({
    id: 'post-up',
    title: 'Post Up',
    setupDescription: '빅맨이 로우포스트에서 목표 손을 보여 주고 수비를 실링합니다.',
    actionLabel: 'SEAL',
    actionDescription: '빅맨이 두 발로 넓게 서서 패스 창을 확보합니다.',
    actionPositions: { big: p(1.2, 2.4), helper: p(0.8, 2.8) },
    pass: {
      fromId: 'handler',
      toId: 'big',
      label: 'ENTRY',
      description: '핸들러가 수비 손에서 먼 쪽으로 포스트 엔트리 패스를 넣습니다.',
    },
    finish: {
      shooterId: 'big',
      label: 'POST FINISH',
      description: '빅맨이 베이스라인 어깨를 확인하고 백보드로 마무리합니다.',
      outcome: 'bank-make',
    },
  }),
  makePlayScenario({
    id: 'screen-the-screener',
    title: 'Screen the Screener',
    setupDescription: '첫 스크린을 건 선수가 다음 스크린을 받을 준비를 합니다.',
    actionLabel: 'FIRST SCREEN',
    actionDescription: '빅맨이 윙의 컷을 위해 다운스크린을 설정합니다.',
    actionPositions: { big: p(3.4, 5.5), wing: p(4.1, 4.7) },
    pass: {
      fromId: 'handler',
      toId: 'big',
      label: 'SECOND SCREEN',
      description: '윙이 되돌아 빅맨의 수비를 막고 빅맨이 림으로 들어갑니다.',
      positions: { wing: p(1.2, 4.5), big: p(0.4, 2.7) },
    },
    finish: {
      shooterId: 'big',
      label: 'FINISH',
      description: '두 번째 스크린으로 열린 빅맨이 림에서 마무리합니다.',
      outcome: 'bank-make',
    },
  }),
  makePlayScenario({
    id: 'stagger-screen',
    title: 'Stagger Screen',
    setupDescription: '두 스크리너가 같은 방향으로 간격을 두고 연속 배치됩니다.',
    actionLabel: 'TWO SCREENS',
    actionDescription: '슈터가 첫 번째와 두 번째 스크린의 어깨를 연속해서 통과합니다.',
    actionPositions: {
      corner: p(-5.5, 2.5),
      big: p(-3.4, 4.5),
      screener: p(-1.5, 6),
      wing: p(-0.8, 7.1),
    },
    pass: {
      fromId: 'handler',
      toId: 'corner',
      label: 'CURL OUT',
      description: '슈터가 두 스크린을 지나 윙으로 나오며 패스를 받습니다.',
      positions: { corner: p(1.4, 7.2) },
    },
    finish: {
      shooterId: 'corner',
      label: 'CATCH & SHOOT',
      description: '발을 미리 정렬한 슈터가 캐치앤슛으로 연결합니다.',
    },
  }),
  makePlayScenario({
    id: 'flare-screen',
    title: 'Flare Screen',
    setupDescription: '슈터가 볼 반대편에서 수비를 안쪽으로 끌어당깁니다.',
    actionLabel: 'FLARE',
    actionDescription: '스크리너가 슈터 수비의 바깥 진행 경로를 막습니다.',
    actionPositions: { screener: p(2.4, 6.2), wing: p(4.8, 8.4) },
    pass: {
      fromId: 'handler',
      toId: 'wing',
      label: 'SKIP',
      description: '핸들러가 플레어로 열린 반대 윙에 스킵 패스를 보냅니다.',
      style: 'lob',
      arcHeight: 1.6,
    },
    finish: {
      shooterId: 'wing',
      label: 'FLARE 3',
      description: '슈터가 림을 향해 몸을 돌리고 긴 3점슛을 시도합니다.',
    },
  }),
  makePlayScenario({
    id: 'slip-screen',
    title: 'Slip Screen',
    setupDescription: '수비가 스크린을 미리 스위치하거나 블리츠하려는지 확인합니다.',
    actionLabel: 'SHOW',
    actionDescription: '스크리너가 접촉 직전까지만 스크린 모양을 보여 줍니다.',
    actionPositions: { screener: p(-1.4, 6.5), helper: p(-0.4, 5.2) },
    pass: {
      fromId: 'handler',
      toId: 'screener',
      label: 'SLIP',
      description: '스크린 접촉 없이 즉시 림으로 빠져나가 패스를 받습니다.',
      style: 'bounce',
      positions: { screener: p(-0.2, 2.8) },
    },
    finish: {
      shooterId: 'screener',
      label: 'FINISH',
      description: '두 수비 사이에 생긴 틈에서 빠르게 마무리합니다.',
      outcome: 'bank-make',
    },
  }),
  makePlayScenario({
    id: 'alley-oop',
    title: 'Alley-Oop',
    setupDescription: '피니셔가 약한 쪽 베이스라인 뒤 공간을 확보합니다.',
    actionLabel: 'LIFT',
    actionDescription: '헬프 수비가 볼에 시선을 두는 순간 피니셔가 림으로 도약합니다.',
    actionPositions: { big: p(-0.4, 2.2), helper: p(1.2, 3.6) },
    pass: {
      fromId: 'handler',
      toId: 'big',
      label: 'LOB',
      description: '핸들러가 림 위, 수비 손이 닿지 않는 높이로 로브를 띄웁니다.',
      style: 'lob',
      arcHeight: 2.4,
    },
    finish: {
      shooterId: 'big',
      label: 'ABOVE RIM',
      description: '피니셔가 공중에서 공을 받아 착지 전에 림 안으로 마무리합니다.',
    },
  }),
] satisfies Scenario[]

const defenseConfigs: PlayConfig[] = [
  {
    id: 'man-to-man',
    title: 'Man-to-Man Defense',
    setupDescription: '각 수비수가 자신의 매치업과 볼 위치를 동시에 확인합니다.',
    actionLabel: 'STANCE',
    actionDescription: '온볼 수비는 볼과 림 사이, 헬프 수비는 갭에 위치합니다.',
    actionPositions: {
      onball: p(-2.3, 7.25),
      helper: p(-0.2, 4.1),
      wing: p(4.8, 7),
    },
  },
  {
    id: 'two-three-zone',
    title: '2–3 Zone',
    setupDescription: '두 명은 위, 세 명은 베이스라인을 책임지는 형태를 만듭니다.',
    actionLabel: 'SHIFT',
    actionDescription: '볼이 윙으로 이동하면 존 전체가 한 칸씩 볼 쪽으로 이동합니다.',
    actionPositions: {
      onball: p(3.8, 6.3),
      helper: p(2.2, 3.1),
      wing: p(5.1, 6.4),
    },
  },
  {
    id: 'three-two-zone',
    title: '3–2 Zone',
    setupDescription: '세 명이 외곽을, 두 명이 로우포스트를 우선 보호합니다.',
    actionLabel: 'FAN OUT',
    actionDescription: '탑과 두 윙 수비가 3점 라인을 따라 넓게 펼쳐집니다.',
    actionPositions: { onball: p(0, 7.1), helper: p(4.1, 5.4) },
  },
  {
    id: 'switch',
    title: 'Switch',
    setupDescription: '스크린 수비 두 명이 서로의 매치업을 바꿀 준비를 합니다.',
    actionLabel: 'EXCHANGE',
    actionDescription: '스크린 접촉 순간 온볼과 스크리너 수비가 담당 선수를 교환합니다.',
    actionPositions: {
      handler: p(-1.1, 6.3),
      screener: p(-1.7, 6.8),
      onball: p(-1.3, 6.5),
      helper: p(-2.1, 6.1),
    },
  },
  {
    id: 'drop-coverage',
    title: 'Drop Coverage',
    setupDescription: '빅맨 수비가 스크린보다 아래에서 림과 롤맨을 함께 봅니다.',
    actionLabel: 'DROP',
    actionDescription: '온볼 수비는 뒤에서 추격하고 빅맨은 페인트 안으로 후퇴합니다.',
    actionPositions: {
      handler: p(-0.8, 5.2),
      screener: p(0, 3.1),
      onball: p(-1.2, 5.7),
      helper: p(0, 2.6),
    },
  },
  {
    id: 'hedge',
    title: 'Hedge',
    setupDescription: '빅맨 수비가 스크린 높이까지 올라올 준비를 합니다.',
    actionLabel: 'SHOW HIGH',
    actionDescription: '빅맨이 잠시 핸들러 앞을 막고 원래 매치업으로 복귀합니다.',
    actionPositions: {
      handler: p(-0.8, 5.9),
      screener: p(-1.5, 6.7),
      helper: p(-0.5, 6),
      onball: p(-1.7, 5.8),
    },
  },
  {
    id: 'blitz',
    title: 'Blitz',
    setupDescription: '두 수비가 볼 핸들러를 강하게 압박할 각도를 맞춥니다.',
    actionLabel: 'TWO TO BALL',
    actionDescription: '스크린 순간 두 수비가 핸들러의 앞과 옆 탈출로를 닫습니다.',
    actionPositions: {
      handler: p(-1, 6),
      onball: p(-1.4, 5.7),
      helper: p(-0.6, 5.7),
    },
  },
  {
    id: 'ice-coverage',
    title: 'ICE Coverage',
    setupDescription: '사이드 픽앤롤을 중앙이 아닌 베이스라인 쪽으로 몰 준비를 합니다.',
    actionLabel: 'DOWN',
    actionDescription: '온볼 수비가 중앙 길을 막고 빅맨은 베이스라인 쪽에서 기다립니다.',
    actionPositions: {
      handler: p(4.6, 5.1),
      onball: p(3.9, 5.2),
      helper: p(4.5, 2.9),
      screener: p(3.8, 5.8),
    },
  },
  {
    id: 'help-and-recover',
    title: 'Help & Recover',
    setupDescription: '약한 쪽 수비가 볼과 자신의 선수를 모두 볼 수 있게 섭니다.',
    actionLabel: 'STUNT',
    actionDescription: '돌파에 한두 걸음 도움을 주고 패스 전에 원래 슈터로 복귀합니다.',
    actionPositions: {
      handler: p(0.3, 3.5),
      helper: p(0.8, 3.2),
      wing: p(5.4, 6.7),
    },
  },
  {
    id: 'closeout',
    title: 'Closeout',
    setupDescription: '수비가 슈터와 림 사이 최단 경로를 확인합니다.',
    actionLabel: 'CHOP',
    actionDescription: '긴 첫걸음 뒤 짧은 스텝으로 감속하며 슛과 돌파를 함께 막습니다.',
    actionPositions: {
      wing: p(5.3, 6.8),
      helper: p(4.7, 6.4),
    },
  },
  {
    id: 'deny',
    title: 'Deny',
    setupDescription: '수비가 자신의 몸을 패스선 위에 두고 한 손을 볼 쪽으로 뻗습니다.',
    actionLabel: 'TOP LOCK',
    actionDescription: '공격수가 원하는 위치로 나오지 못하도록 위쪽 길을 선점합니다.',
    actionPositions: { wing: p(5.1, 7), helper: p(4.55, 6.8) },
  },
  {
    id: 'trap',
    title: 'Trap',
    setupDescription: '사이드라인을 세 번째 수비수처럼 활용할 지점을 선택합니다.',
    actionLabel: 'SEAL EXITS',
    actionDescription: '두 수비가 발을 겹치지 않고 양쪽 탈출로를 각각 닫습니다.',
    actionPositions: {
      handler: p(5.8, 5.8),
      onball: p(5.2, 5.6),
      helper: p(5.7, 4.9),
    },
  },
  {
    id: 'box-out',
    title: 'Box Out',
    setupDescription: '슛이 올라가면 먼저 상대 몸을 찾고 림을 확인합니다.',
    actionLabel: 'HIT & FIND',
    actionDescription: '수비가 공격수와 림 사이에 엉덩이와 등을 넣어 공간을 확보합니다.',
    actionPositions: {
      big: p(0.4, 2.7),
      helper: p(0.4, 3.35),
    },
  },
  {
    id: 'weak-side-rotation',
    title: 'Weak-Side Rotation',
    setupDescription: '볼 반대편 수비가 림과 코너 슈터 사이의 거리를 읽습니다.',
    actionLabel: 'LOW MAN',
    actionDescription: '돌파가 시작되면 로우맨이 롤맨을 막고 다음 수비가 코너를 메웁니다.',
    actionPositions: {
      handler: p(0.4, 3.3),
      helper: p(0.2, 2.7),
      onball: p(-1.2, 4.2),
      corner: p(-5.6, 2.4),
    },
  },
]

const defensePlays = defenseConfigs.map(makePlayScenario)

type SkillConfig = Readonly<{
  id: string
  title: string
  path: readonly Point3[]
  labels: readonly string[]
  descriptions: readonly string[]
  outcome?: ShotOutcome
  defender?: Point3
}>

const SKILL_BALL_MOTIONS: Readonly<Record<string, BallMotion>> = {
  crossover: 'crossover',
  'between-the-legs': 'between-the-legs',
  'behind-the-back': 'behind-the-back',
  hesitation: 'hesitation',
  'in-and-out': 'in-and-out',
  'spin-move': 'spin',
  'euro-step': 'dribble',
  'jump-stop': 'dribble',
}

function makeSkillScenario(config: SkillConfig): Scenario {
  const actors: ActorSpec[] = [
    actor('handler', '공격수', 1, 'offense', config.path[0]),
  ]
  if (config.defender) {
    actors.push(actor('defender', '수비수', 7, 'defense', config.defender))
  }

  const phases: ScenarioPhase[] = [
    {
      id: 'ready',
      label: 'READY',
      description: '낮은 자세에서 림과 수비를 함께 보며 동작을 준비합니다.',
      durationMs: 560,
      ball: { type: 'owned', ownerId: 'handler' },
      focusActorIds: ['handler'],
    },
    ...config.path.slice(1).map((position, index) => ({
      id: `step-${index + 1}`,
      label: config.labels[index] ?? `STEP ${index + 1}`,
      description:
        config.descriptions[index] ??
        '중심을 유지하며 다음 공간으로 이동합니다.',
      durationMs: 680,
      positions: { handler: position },
      ball: {
        type: 'owned',
        ownerId: 'handler',
        motion: SKILL_BALL_MOTIONS[config.id] ?? 'hold',
      } as const,
      focusActorIds: ['handler'],
    })),
  ]

  if (config.outcome) {
    phases.push({
      id: 'release',
      label: 'RELEASE',
      description: '발과 어깨를 림에 정렬하고 균형 있게 공을 놓습니다.',
      durationMs: 1350,
      ball: {
        type: 'shot',
        shooterId: 'handler',
        outcome: config.outcome,
      },
      focusActorIds: ['handler'],
    })
  }

  return {
    id: config.id,
    title: config.title,
    mode: 'skill',
    actors,
    phases,
    shotOutcome: config.outcome,
  }
}

const skillScenarios = [
  {
    id: 'jump-shot',
    title: 'Jump Shot',
    path: [p(1, 6.2), p(1, 5.9)],
    labels: ['LOAD'],
    descriptions: ['무릎과 엉덩이를 낮추며 공을 슈팅 포켓으로 올립니다.'],
    outcome: 'swish',
    defender: p(1.5, 5.2),
  },
  {
    id: 'pull-up-jumper',
    title: 'Pull-Up Jumper',
    path: [p(-2.5, 7.5), p(-1.2, 5.7), p(-0.8, 5.3)],
    labels: ['ATTACK', 'BRAKE'],
    descriptions: [
      '드리블로 수비의 뒤꿈치를 움직이게 만듭니다.',
      '안쪽 발로 감속하고 두 발을 림에 정렬합니다.',
    ],
    outcome: 'swish',
    defender: p(-1.1, 4.7),
  },
  {
    id: 'step-back',
    title: 'Step-Back',
    path: [p(-2.2, 6.5), p(-1.1, 4.8), p(-2.1, 6.1)],
    labels: ['DRIVE', 'SEPARATE'],
    descriptions: [
      '먼저 림을 공격해 수비가 뒤로 반응하게 만듭니다.',
      '앞발로 지면을 밀어 뒤로 공간을 만들고 균형을 회복합니다.',
    ],
    outcome: 'swish',
    defender: p(-0.8, 4.2),
  },
  {
    id: 'fadeaway',
    title: 'Fadeaway',
    path: [p(1.2, 3.1), p(1.1, 3.2), p(1.5, 3.8)],
    labels: ['TURN', 'FADE'],
    descriptions: [
      '피벗으로 슈팅 어깨를 림 쪽으로 엽니다.',
      '수비와 반대 방향으로 떠오르되 상체 균형을 유지합니다.',
    ],
    outcome: 'swish',
    defender: p(0.9, 2.7),
  },
  {
    id: 'layup',
    title: 'Layup',
    path: [p(2.3, 5), p(1.2, 3.1), p(0.6, 2.15)],
    labels: ['GATHER', 'TWO STEPS'],
    descriptions: [
      '드리블을 모으며 첫 스텝의 방향을 림 쪽으로 잡습니다.',
      '두 번째 스텝에서 위로 올라가 백보드 각도를 만듭니다.',
    ],
    outcome: 'bank-make',
    defender: p(0.1, 2.2),
  },
  {
    id: 'hook-shot',
    title: 'Hook Shot',
    path: [p(-1.2, 3), p(-0.8, 2.7), p(-0.5, 2.8)],
    labels: ['MIDDLE', 'EXTEND'],
    descriptions: [
      '수비를 먼 어깨에 둔 채 가운데로 피벗합니다.',
      '림 쪽 팔을 길게 펴 높은 지점에서 공을 놓습니다.',
    ],
    outcome: 'swish',
    defender: p(-1.1, 2.4),
  },
  {
    id: 'crossover',
    title: 'Crossover',
    path: [p(-2.4, 8), p(-1.4, 7), p(0.9, 6.1)],
    labels: ['SELL', 'CROSS'],
    descriptions: [
      '어깨와 시선으로 한쪽 돌파를 먼저 팔아 수비의 체중을 옮깁니다.',
      '공을 무릎 아래로 반대손에 보내며 반대 방향으로 폭발합니다.',
    ],
    defender: p(-0.4, 6.1),
  },
  {
    id: 'between-the-legs',
    title: 'Between the Legs',
    path: [p(-2.1, 7.8), p(-1.2, 6.9), p(0.2, 5.9)],
    labels: ['PROTECT', 'TRANSFER'],
    descriptions: [
      '앞발을 수비 쪽에 두어 공이 지나갈 보호 통로를 만듭니다.',
      '공을 다리 사이로 보내고 반대손과 반대발이 함께 전진합니다.',
    ],
    defender: p(-0.1, 5.6),
  },
  {
    id: 'behind-the-back',
    title: 'Behind the Back',
    path: [p(2.3, 7.8), p(1.1, 6.8), p(-0.5, 5.9)],
    labels: ['SHIELD', 'WRAP'],
    descriptions: [
      '몸을 공과 수비 사이에 넣어 공을 보호합니다.',
      '엉덩이 뒤로 공을 감아 반대손에 전달하며 방향을 바꿉니다.',
    ],
    defender: p(0.3, 5.7),
  },
  {
    id: 'hesitation',
    title: 'Hesitation',
    path: [p(-2.1, 7.5), p(-1.1, 6.2), p(-1.05, 6.15), p(0, 4.8)],
    labels: ['ATTACK', 'PAUSE', 'GO'],
    descriptions: [
      '속도를 올려 수비가 후퇴하게 만듭니다.',
      '상체를 세우고 공을 잠시 높여 슛 또는 정지를 암시합니다.',
      '수비가 일어서는 순간 다시 낮아져 전진합니다.',
    ],
    defender: p(-0.2, 5.2),
  },
  {
    id: 'in-and-out',
    title: 'In & Out',
    path: [p(2.3, 7.5), p(1.1, 6.4), p(0.35, 5.8), p(1.4, 4.7)],
    labels: ['IN', 'KEEP', 'OUT'],
    descriptions: [
      '한 손으로 공을 몸 안쪽으로 끌어 크로스오버처럼 보이게 합니다.',
      '손을 바꾸지 않고 같은 손으로 공의 바깥을 다시 밀어냅니다.',
      '수비의 반대 반응을 이용해 원래 진행 방향으로 돌파합니다.',
    ],
    defender: p(0.4, 5),
  },
  {
    id: 'spin-move',
    title: 'Spin Move',
    path: [p(-2.2, 6.8), p(-1.1, 5.4), p(-0.2, 5), p(0.6, 4.1)],
    labels: ['CONTACT', 'PIVOT', 'EXIT'],
    descriptions: [
      '수비의 옆구리에 어깨를 붙여 회전축을 만듭니다.',
      '안쪽 발을 축으로 공과 몸을 함께 180도 회전합니다.',
      '공을 바깥손으로 옮겨 수비 뒤 공간으로 빠져나갑니다.',
    ],
    defender: p(-0.5, 4.9),
  },
  {
    id: 'euro-step',
    title: 'Euro Step',
    path: [p(0, 4.8), p(-1, 3.3), p(1, 2.3)],
    labels: ['FIRST STEP', 'SECOND STEP'],
    descriptions: [
      '첫 스텝을 수비 한쪽으로 크게 내디뎌 몸을 움직이게 합니다.',
      '두 번째 스텝을 반대편으로 옮겨 충돌을 피하고 림을 엽니다.',
    ],
    outcome: 'bank-make',
    defender: p(0, 2.5),
  },
  {
    id: 'jump-stop',
    title: 'Jump Stop',
    path: [p(-1.8, 6.8), p(-0.7, 5), p(-0.7, 4.9)],
    labels: ['GATHER', 'TWO FEET'],
    descriptions: [
      '공을 모으며 수평 속도를 줄이고 발을 같은 타이밍에 준비합니다.',
      '두 발로 동시에 착지해 균형과 두 가지 피벗 선택지를 확보합니다.',
    ],
    defender: p(-0.2, 4.2),
  },
  {
    id: 'pivot',
    title: 'Pivot',
    path: [p(0.8, 5.5), p(0.8, 5.5), p(1.5, 5.1)],
    labels: ['ANCHOR', 'OPEN'],
    descriptions: [
      '축발을 바닥에 고정하고 무릎을 굽혀 중심을 낮춥니다.',
      '다른 발로 호를 그리며 패스와 돌파 각도를 새로 만듭니다.',
    ],
    defender: p(0.7, 4.7),
  },
  {
    id: 'triple-threat',
    title: 'Triple Threat',
    path: [p(-1, 6), p(-1, 5.9), p(-0.7, 5.7)],
    labels: ['SQUARE', 'JAB'],
    descriptions: [
      '공을 보호하며 림을 보고 슛·패스·돌파 세 선택을 유지합니다.',
      '축발을 지키며 짧은 잽으로 수비의 반응을 확인합니다.',
    ],
    defender: p(-0.6, 5),
  },
] satisfies SkillConfig[]

const builtSkills = skillScenarios.map(makeSkillScenario)

type PassConfig = Readonly<{
  id: string
  title: string
  from: Point3
  to: Point3
  style?: 'direct' | 'bounce' | 'lob'
  arcHeight?: number
  description: string
}>

function makePassScenario(config: PassConfig): Scenario {
  return {
    id: config.id,
    title: config.title,
    mode: 'skill',
    actors: [
      actor('passer', '패서', 1, 'offense', config.from),
      actor('receiver', '리시버', 2, 'offense', config.to),
      actor(
        'defender',
        '수비수',
        7,
        'defense',
        p(
          (config.from.x + config.to.x) / 2,
          (config.from.y + config.to.y) / 2 + 0.7,
        ),
      ),
    ],
    phases: [
      {
        id: 'target',
        label: 'TARGET',
        description: '패서는 리시버와 수비의 손 위치를 함께 확인합니다.',
        durationMs: 600,
        ball: { type: 'owned', ownerId: 'passer' },
        focusActorIds: ['passer', 'receiver'],
      },
      {
        id: 'deliver',
        label: 'DELIVER',
        description: config.description,
        durationMs: 900,
        ball: {
          type: 'pass',
          fromId: 'passer',
          toId: 'receiver',
          style: config.style,
          arcHeight: config.arcHeight,
        },
        focusActorIds: ['passer', 'receiver'],
      },
      {
        id: 'secure',
        label: 'SECURE',
        description: '리시버가 두 손으로 공을 확보하고 즉시 다음 플레이를 봅니다.',
        durationMs: 600,
        ball: { type: 'owned', ownerId: 'receiver' },
        focusActorIds: ['receiver'],
      },
    ],
  }
}

const passScenarios = [
  {
    id: 'chest-pass',
    title: 'Chest Pass',
    from: p(-3.5, 6.5),
    to: p(3.5, 6.5),
    arcHeight: 0.35,
    description: '양손을 가슴에서 곧게 밀어 리시버의 가슴으로 빠르게 보냅니다.',
  },
  {
    id: 'bounce-pass',
    title: 'Bounce Pass',
    from: p(-3.5, 5.5),
    to: p(2.5, 3.8),
    style: 'bounce',
    description: '수비 손 아래, 전체 거리의 절반보다 조금 지난 지점을 향해 바운드시킵니다.',
  },
  {
    id: 'overhead-pass',
    title: 'Overhead Pass',
    from: p(-2.8, 6.8),
    to: p(3, 4.4),
    arcHeight: 0.8,
    description: '공을 머리 위에서 놓아 수비 팔 위로 직선에 가깝게 전달합니다.',
  },
  {
    id: 'skip-pass',
    title: 'Skip Pass',
    from: p(-5.6, 2.5),
    to: p(5.4, 7),
    style: 'lob',
    arcHeight: 1.7,
    description: '도움수비가 모인 코트를 가로질러 반대편 열린 슈터에게 보냅니다.',
  },
  {
    id: 'outlet-pass',
    title: 'Outlet Pass',
    from: p(0, 2.4),
    to: p(5.6, 9.2),
    style: 'lob',
    arcHeight: 1.5,
    description: '리바운드 후 사이드라인을 달리는 가드의 앞 공간으로 전진시킵니다.',
  },
  {
    id: 'pocket-pass',
    title: 'Pocket Pass',
    from: p(-1.5, 5.5),
    to: p(0, 2.7),
    style: 'bounce',
    description: '픽앤롤 두 수비 사이의 좁은 포켓으로 낮고 빠르게 넣습니다.',
  },
  {
    id: 'lob-pass',
    title: 'Lob Pass',
    from: p(3.6, 5.8),
    to: p(0.2, 2.1),
    style: 'lob',
    arcHeight: 2.5,
    description: '수비 손 위이면서 리시버가 공중에서 받을 수 있는 림 근처로 띄웁니다.',
  },
  {
    id: 'no-look-pass',
    title: 'No-Look Pass',
    from: p(-1.4, 5.4),
    to: p(5.4, 2.4),
    arcHeight: 0.55,
    description: '시선은 반대편에 둔 채 몸과 손목 각도로 실제 타깃에 전달합니다.',
  },
] satisfies PassConfig[]

const builtPasses = passScenarios.map(makePassScenario)

function makeShotScenario(
  id: string,
  title: string,
  outcome: ShotOutcome,
  origin: Point3,
): Scenario {
  return {
    id,
    title,
    mode: 'shot',
    actors: [actor('shooter', '슈터', 1, 'offense', origin)],
    phases: [
      {
        id: 'set',
        label: 'SET',
        description: '슈터가 발과 어깨를 림에 맞추고 릴리스 지점을 준비합니다.',
        durationMs: 650,
        ball: { type: 'owned', ownerId: 'shooter' },
        focusActorIds: ['shooter'],
      },
      {
        id: 'flight',
        label: outcome.toUpperCase(),
        description:
          outcome === 'airball'
            ? '공의 중심이 림과 백보드 접촉 범위를 모두 벗어나 그대로 지나갑니다.'
            : outcome === 'bank-make'
              ? '공이 백보드에 먼저 닿은 뒤 방향을 바꿔 림 안으로 들어갑니다.'
              : '공의 높이와 림 진입 위치가 실제 결과에 맞게 이어집니다.',
        durationMs: 1650,
        ball: { type: 'shot', shooterId: 'shooter', outcome },
        focusActorIds: ['shooter'],
      },
    ],
    shotOutcome: outcome,
  }
}

const shotScenarios = [
  makeShotScenario('three-pointer', 'Three-Pointer', 'swish', p(4.2, 8.4)),
  makeShotScenario('floater', 'Floater', 'swish', p(0.8, 4.4)),
  makeShotScenario('bank-shot', 'Bank Shot', 'bank-make', p(3.4, 6.1)),
  makeShotScenario('swish', 'Swish', 'swish', p(-2.5, 6.4)),
  makeShotScenario('airball', 'Airball', 'airball', p(3.8, 8)),
  makeShotScenario('rim-out', 'Rim Out', 'rim-out', p(-3.6, 7.2)),
]

type RuleConfig = Readonly<{
  id: string
  title: string
  description: string
  start: Point3
  end: Point3
  defender?: Point3
  shotOutcome?: ShotOutcome
}>

function makeRuleScenario(config: RuleConfig): Scenario {
  const actors = [
    actor('handler', '공격수', 1, 'offense', config.start),
  ]
  if (config.defender) {
    actors.push(actor('defender', '수비수', 7, 'defense', config.defender))
  }

  return {
    id: config.id,
    title: config.title,
    mode: 'rule',
    actors,
    phases: [
      {
        id: 'legal',
        label: 'LEGAL STATE',
        description: '위반이 발생하기 전의 합법적인 위치와 볼 상태를 확인합니다.',
        durationMs: 650,
        ball: { type: 'owned', ownerId: 'handler' },
        focusActorIds: ['handler'],
      },
      {
        id: 'violation',
        label: 'VIOLATION',
        description: config.description,
        durationMs: 1100,
        positions: {
          handler: config.end,
          ...(config.id === 'goaltending'
            ? { defender: p(config.defender?.x ?? 0, config.defender?.y ?? 2.2, 0.75) }
            : {}),
        },
        ball: config.shotOutcome
          ? {
              type: 'shot',
              shooterId: 'handler',
              outcome: config.shotOutcome,
            }
          : { type: 'owned', ownerId: 'handler' },
        focusActorIds: config.defender
          ? ['handler', 'defender']
          : ['handler'],
      },
      {
        id: 'whistle',
        label: 'WHISTLE',
        description: '플레이가 중단되고 상대 팀에 규정된 방식으로 볼이 주어집니다.',
        durationMs: 700,
        ball: { type: 'none' },
        focusActorIds: [],
      },
    ],
    shotOutcome: config.shotOutcome,
  }
}

const ruleScenarios = [
  {
    id: 'traveling',
    title: 'Traveling',
    description: '공을 잡은 뒤 합법적인 피벗이나 두 스텝 범위를 넘어 발을 이동합니다.',
    start: p(-1.5, 6.5),
    end: p(0.8, 4.6),
  },
  {
    id: 'double-dribble',
    title: 'Double Dribble',
    description: '드리블을 끝내 공을 잡은 선수가 다시 드리블을 시작합니다.',
    start: p(-1.2, 6.7),
    end: p(-0.4, 5.3),
  },
  {
    id: 'three-second-violation',
    title: 'Three-Second Violation',
    description: '공격수가 팀이 프런트코트 볼을 소유한 동안 페인트에 3초를 초과해 머뭅니다.',
    start: p(0.4, 3.2),
    end: p(0.4, 3.2),
  },
  {
    id: 'shot-clock-violation',
    title: 'Shot-Clock Violation',
    description: '제한 시간이 끝나기 전에 슛을 놓지 못하거나 공이 림에 닿지 않습니다.',
    start: p(0, 7),
    end: p(0, 6.5),
  },
  {
    id: 'backcourt-violation',
    title: 'Backcourt Violation',
    description: '프런트코트에 팀 컨트롤을 만든 뒤 같은 팀이 공을 다시 백코트로 보냅니다.',
    start: p(0, 13.2),
    end: p(0, 14.7),
  },
  {
    id: 'goaltending',
    title: 'Goaltending',
    description: '공이 하강 중이고 득점 가능성이 있을 때 수비가 림 위 공을 건드립니다.',
    start: p(2.4, 5.4),
    end: p(2.1, 5),
    defender: p(0.2, 2.3),
    shotOutcome: 'swish',
  },
  {
    id: 'charging',
    title: 'Charging',
    description: '합법적인 수비 위치를 먼저 확보한 수비수의 몸통으로 공격수가 돌진합니다.',
    start: p(0, 5.2),
    end: p(0, 3.4),
    defender: p(0, 3.35),
  },
] satisfies RuleConfig[]

const builtRules = ruleScenarios.map(makeRuleScenario)

function makeCourtScenario(
  id: string,
  title: string,
  highlight: CourtHighlight,
  description: string,
): Scenario {
  return {
    id,
    title,
    mode: 'court',
    actors: [],
    phases: [
      {
        id: 'locate',
        label: 'LOCATE',
        description,
        durationMs: 1200,
        ball: { type: 'none' },
      },
    ],
    highlight,
  }
}

const courtScenarios = [
  makeCourtScenario(
    'paint',
    'The Paint',
    'paint',
    '베이스라인과 자유투 라인 사이의 직사각형 구역을 강조합니다.',
  ),
  makeCourtScenario(
    'elbow',
    'The Elbow',
    'left-elbow',
    '자유투 라인과 페인트 옆선이 만나는 지점을 강조합니다.',
  ),
  makeCourtScenario(
    'wing',
    'The Wing',
    'right-wing',
    '자유투 라인 연장선 부근의 3점선 바깥 측면 공간을 강조합니다.',
  ),
  makeCourtScenario(
    'corner',
    'The Corner',
    'right-corner',
    '베이스라인과 사이드라인이 만나는 코너 3점 공간을 강조합니다.',
  ),
  makeCourtScenario(
    'three-point-line',
    'Three-Point Line',
    'three-point-line',
    '림 중심의 공식 원호와 두 코너 평행선 전체를 강조합니다.',
  ),
]

const allScenarios = [
  ...offensePlays,
  giveAndGo,
  ...defensePlays,
  ...builtSkills,
  ...builtPasses,
  ...shotScenarios,
  ...builtRules,
  ...courtScenarios,
]

export const SCENARIOS: Readonly<Record<string, Scenario>> =
  Object.fromEntries(
    allScenarios.map((scenario) => [scenario.id, scenario]),
  )
