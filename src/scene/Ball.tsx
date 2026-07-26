import { COURT } from '../sim/court'
import { toRenderPosition } from '../sim/coordinates'
import type { SimulationBall } from '../sim/scenario'

type BallProps = Readonly<{
  ball: SimulationBall
}>

export function Ball({ ball }: BallProps) {
  if (!ball.visible) {
    return null
  }

  const [x, y, z] = toRenderPosition(ball.position)
  const shadowOpacity = Math.max(0.08, 0.28 - ball.position.z * 0.035)
  const shadowScale = Math.min(2.1, 0.72 + ball.position.z * 0.2)

  return (
    <>
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[x, 0.021, z]}
        scale={[shadowScale, shadowScale, shadowScale]}
      >
        <circleGeometry args={[COURT.ballRadius * 0.92, 28]} />
        <meshBasicMaterial
          color="#07101c"
          transparent
          opacity={shadowOpacity}
          depthWrite={false}
        />
      </mesh>
      <group position={[x, y, z]}>
        <mesh castShadow>
          <sphereGeometry args={[COURT.ballRadius, 32, 20]} />
          <meshStandardMaterial
            color="#d8682c"
            roughness={0.82}
            metalness={0.02}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry
            args={[COURT.ballRadius * 0.99, 0.006, 8, 40]}
          />
          <meshBasicMaterial color="#3a1e14" />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry
            args={[COURT.ballRadius * 0.99, 0.006, 8, 40]}
          />
          <meshBasicMaterial color="#3a1e14" />
        </mesh>
      </group>
    </>
  )
}
