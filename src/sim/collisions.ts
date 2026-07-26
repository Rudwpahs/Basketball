import { COURT } from './court'
import type { ShotPath } from './shots'

type RimContact = Readonly<{
  pointIndex: number
  side: 'front' | 'back'
}>

type BackboardContact = Readonly<{
  pointIndex: number
}>

export type ShotInspection = Readonly<{
  rimContacts: readonly RimContact[]
  backboardContacts: readonly BackboardContact[]
  minimumRimClearance: number
}>

function rimClearance(
  point: ShotPath['points'][number],
): number {
  const dx = point.x - COURT.rim.x
  const dy = point.y - COURT.rim.y
  const radialDistance = Math.hypot(dx, dy)
  const ringCenterlineRadius =
    COURT.rimInnerRadius + COURT.rimTubeRadius
  const distanceToRingCenterline = Math.hypot(
    radialDistance - ringCenterlineRadius,
    point.z - COURT.rim.z,
  )

  return (
    distanceToRingCenterline -
    (COURT.ballRadius + COURT.rimTubeRadius)
  )
}

function touchesBackboard(
  point: ShotPath['points'][number],
): boolean {
  const withinWidth =
    Math.abs(point.x) <=
    COURT.backboardWidth / 2 + COURT.ballRadius
  const withinHeight =
    point.z >= COURT.backboardBottomZ - COURT.ballRadius &&
    point.z <=
      COURT.backboardBottomZ +
        COURT.backboardHeight +
        COURT.ballRadius
  const reachesPlane =
    Math.abs(point.y - COURT.backboardY) <=
    COURT.ballRadius + 0.0001

  return withinWidth && withinHeight && reachesPlane
}

export function inspectShotPath(path: ShotPath): ShotInspection {
  const rimContacts: RimContact[] = []
  const backboardContacts: BackboardContact[] = []
  let inRimContact = false
  let inBackboardContact = false
  let minimumRimClearance = Number.POSITIVE_INFINITY

  path.points.forEach((point, pointIndex) => {
    const clearance = rimClearance(point)
    minimumRimClearance = Math.min(minimumRimClearance, clearance)
    const rimTouching = clearance <= 0.0001

    if (rimTouching && !inRimContact) {
      rimContacts.push({
        pointIndex,
        side: point.y >= COURT.rim.y ? 'front' : 'back',
      })
    }
    inRimContact = rimTouching

    const boardTouching = touchesBackboard(point)
    if (boardTouching && !inBackboardContact) {
      backboardContacts.push({ pointIndex })
    }
    inBackboardContact = boardTouching
  })

  return {
    rimContacts,
    backboardContacts,
    minimumRimClearance,
  }
}
