import { Edges, Line } from '@react-three/drei'
import { COURT } from '../sim/court'
import { toRenderPosition } from '../sim/coordinates'

const NET_SEGMENTS = Array.from({ length: 12 }, (_, index) => {
  const angle = (index / 12) * Math.PI * 2
  const topRadius = COURT.rimInnerRadius + COURT.rimTubeRadius
  const bottomRadius = 0.14

  return [
    [
      Math.cos(angle) * topRadius,
      COURT.rim.z - 0.02,
      -COURT.rim.y + Math.sin(angle) * topRadius,
    ],
    [
      Math.cos(angle + 0.3) * bottomRadius,
      COURT.rim.z - 0.58,
      -COURT.rim.y + Math.sin(angle + 0.3) * bottomRadius,
    ],
  ] as const
})

export function Basket() {
  const rim = toRenderPosition(COURT.rim)
  const boardCenterY =
    COURT.backboardBottomZ + COURT.backboardHeight / 2

  return (
    <group>
      <mesh
        castShadow
        receiveShadow
        position={[0, boardCenterY, -COURT.backboardY]}
      >
        <boxGeometry
          args={[
            COURT.backboardWidth,
            COURT.backboardHeight,
            0.065,
          ]}
        />
        <meshPhysicalMaterial
          color="#eaf1f0"
          transparent
          opacity={0.62}
          roughness={0.16}
          transmission={0.12}
        />
        <Edges color="#243445" />
      </mesh>
      <Line
        points={[
          [-0.295, 3.09, -COURT.backboardY - 0.038],
          [0.295, 3.09, -COURT.backboardY - 0.038],
          [0.295, 3.54, -COURT.backboardY - 0.038],
          [-0.295, 3.54, -COURT.backboardY - 0.038],
          [-0.295, 3.09, -COURT.backboardY - 0.038],
        ]}
        color="#243445"
        lineWidth={1.3}
      />
      <mesh
        castShadow
        position={rim}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry
          args={[
            COURT.rimInnerRadius + COURT.rimTubeRadius,
            COURT.rimTubeRadius,
            12,
            64,
          ]}
        />
        <meshStandardMaterial
          color="#e34b32"
          roughness={0.44}
          metalness={0.38}
        />
      </mesh>
      {NET_SEGMENTS.map((segment, index) => (
        <Line
          key={index}
          points={segment}
          color="#f7f1e7"
          transparent
          opacity={0.75}
          lineWidth={0.7}
        />
      ))}
      <mesh castShadow position={[0, 1.58, -0.57]}>
        <cylinderGeometry args={[0.08, 0.11, 3.16, 20]} />
        <meshStandardMaterial
          color="#142235"
          roughness={0.62}
          metalness={0.35}
        />
      </mesh>
      <mesh
        castShadow
        position={[0, 3.03, -0.91]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.06, 0.06, 0.7, 16]} />
        <meshStandardMaterial color="#142235" metalness={0.35} />
      </mesh>
    </group>
  )
}
