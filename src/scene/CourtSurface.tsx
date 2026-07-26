import { COURT } from '../sim/court'
import type { CourtHighlight } from '../sim/scenario'

type CourtSurfaceProps = Readonly<{
  highlight?: CourtHighlight
}>

const SPOTLIGHTS: Partial<
  Record<
    CourtHighlight,
    Readonly<{
      position: readonly [number, number, number]
      scale: readonly [number, number, number]
      circular?: boolean
    }>
  >
> = {
  paint: {
    position: [0, 0.006, -COURT.freeThrowY / 2],
    scale: [COURT.laneHalfWidth, COURT.freeThrowY / 2, 1],
  },
  'left-elbow': {
    position: [-COURT.laneHalfWidth, 0.012, -COURT.freeThrowY],
    scale: [0.68, 0.68, 1],
    circular: true,
  },
  'right-wing': {
    position: [5.2, 0.012, -6.4],
    scale: [0.82, 0.82, 1],
    circular: true,
  },
  'right-corner': {
    position: [6.7, 0.012, -1.35],
    scale: [0.72, 0.72, 1],
    circular: true,
  },
}

export function CourtSurface({ highlight }: CourtSurfaceProps) {
  const spotlight = highlight ? SPOTLIGHTS[highlight] : undefined

  return (
    <group>
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.015, -COURT.halfLength / 2]}
      >
        <planeGeometry args={[COURT.halfWidth * 2, COURT.halfLength]} />
        <meshStandardMaterial
          color="#c88a55"
          roughness={0.78}
          metalness={0.01}
        />
      </mesh>
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.022, -COURT.halfLength / 2]}
      >
        <planeGeometry
          args={[
            COURT.halfWidth * 2 + 4,
            COURT.halfLength + 4,
          ]}
        />
        <meshStandardMaterial color="#172538" roughness={0.91} />
      </mesh>
      {spotlight ? (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={spotlight.position}
          scale={spotlight.scale}
        >
          {spotlight.circular ? (
            <circleGeometry args={[1, 48]} />
          ) : (
            <planeGeometry args={[2, 2]} />
          )}
          <meshBasicMaterial
            color="#e34b32"
            transparent
            opacity={0.32}
            depthWrite={false}
          />
        </mesh>
      ) : null}
    </group>
  )
}
