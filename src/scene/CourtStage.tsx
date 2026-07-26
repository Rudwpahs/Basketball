import { OrbitControls } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useState } from 'react'
import type {
  CourtHighlight,
  SimulationFrame,
} from '../sim/scenario'
import type { Point3 } from '../sim/types'
import { Actor } from './Actor'
import { Ball } from './Ball'
import { Basket } from './Basket'
import { CameraRig, type CameraPreset } from './CameraRig'
import { CourtMarkings } from './CourtMarkings'
import { CourtSurface } from './CourtSurface'
import { TrajectoryTrail } from './TrajectoryTrail'

type CourtStageProps = Readonly<{
  frame: SimulationFrame
  highlight?: CourtHighlight
  cameraPreset?: CameraPreset
  trail?: readonly Point3[]
  forceFallback?: boolean
}>

function detectWebGL(): boolean {
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    !window.WebGLRenderingContext
  ) {
    return false
  }

  try {
    const canvas = document.createElement('canvas')
    return Boolean(
      canvas.getContext('webgl2') ?? canvas.getContext('webgl'),
    )
  } catch {
    return false
  }
}

function VisibilityController() {
  const setFrameloop = useThree((state) => state.setFrameloop)
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    const update = () => {
      if (document.hidden) {
        setFrameloop('never')
      } else {
        setFrameloop('always')
        invalidate()
      }
    }

    update()
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [invalidate, setFrameloop])

  return null
}

function StageScene({
  frame,
  highlight,
  cameraPreset,
  trail,
}: Required<
  Pick<CourtStageProps, 'frame' | 'cameraPreset'>
> &
  Pick<CourtStageProps, 'highlight' | 'trail'>) {
  return (
    <>
      <color attach="background" args={['#0b1320']} />
      <fog attach="fog" args={['#0b1320', 20, 38]} />
      <ambientLight intensity={0.76} />
      <hemisphereLight
        args={['#fff2dc', '#172538', 1.12]}
        position={[0, 12, 0]}
      />
      <directionalLight
        castShadow
        position={[7, 13, 8]}
        intensity={2.2}
        color="#fff4df"
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={32}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={14}
        shadow-camera-bottom={-4}
      />
      <CourtSurface highlight={highlight} />
      <CourtMarkings highlight={highlight} />
      <Basket />
      {Object.values(frame.actors).map((actor) => (
        <Actor key={actor.id} actor={actor} />
      ))}
      <TrajectoryTrail points={trail} />
      <Ball ball={frame.ball} />
      <CameraRig preset={cameraPreset} />
      <VisibilityController />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={8}
        maxDistance={24}
        minPolarAngle={0.36}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 0.7, -5.6]}
      />
    </>
  )
}

export function CourtStage({
  frame,
  highlight,
  cameraPreset = 'coach',
  trail,
  forceFallback = false,
}: CourtStageProps) {
  const [webGLAvailable] = useState(
    () => !forceFallback && detectWebGL(),
  )

  return (
    <div
      className="court-stage"
      role="img"
      aria-label={frame.a11yDescription}
    >
      {webGLAvailable ? (
        <Canvas
          aria-hidden="true"
          shadows
          dpr={[1, 1.75]}
          camera={{
            position: [10.8, 10.4, 10.5],
            fov: 42,
            near: 0.1,
            far: 80,
          }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
          }}
        >
          <Suspense fallback={null}>
            <StageScene
              frame={frame}
              highlight={highlight}
              cameraPreset={cameraPreset}
              trail={trail}
            />
          </Suspense>
        </Canvas>
      ) : (
        <div className="court-stage__fallback">
          <span>3D 코트를 불러올 수 없습니다.</span>
          <strong>현재 단계: {frame.phase.label}</strong>
          <p>{frame.phase.description}</p>
        </div>
      )}
    </div>
  )
}
