import { Html } from '@react-three/drei'
import { toRenderPosition } from '../sim/coordinates'
import type { SimulationActor } from '../sim/scenario'

type ActorProps = Readonly<{
  actor: SimulationActor
}>

const TEAM_COLOURS = {
  offense: {
    body: '#0b1320',
    accent: '#f2ebdd',
  },
  defense: {
    body: '#e34b32',
    accent: '#fff7e8',
  },
} as const

export function Actor({ actor }: ActorProps) {
  const colours = TEAM_COLOURS[actor.team]

  return (
    <group position={toRenderPosition(actor.position)}>
      <mesh castShadow position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.27, 0.34, 0.9, 20]} />
        <meshStandardMaterial
          color={colours.body}
          roughness={0.72}
          metalness={0.04}
        />
      </mesh>
      <mesh castShadow position={[0, 1.22, 0]}>
        <sphereGeometry args={[0.2, 20, 16]} />
        <meshStandardMaterial color="#9d6546" roughness={0.9} />
      </mesh>
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.018, 0]}
      >
        <ringGeometry args={[0.37, 0.44, 36]} />
        <meshBasicMaterial
          color={actor.focused ? '#f4c95d' : colours.body}
          transparent
          opacity={actor.focused ? 1 : 0.64}
        />
      </mesh>
      <Html center position={[0, 1.72, 0]} distanceFactor={9}>
        <span
          className={`player-marker player-marker--${actor.team}`}
          aria-hidden="true"
        >
          {actor.number}
        </span>
      </Html>
    </group>
  )
}
