import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Vector3 } from 'three'
import { useReducedMotion } from '../hooks/useReducedMotion'

export type CameraPreset = 'coach' | 'top' | 'rim'

const PRESETS: Record<
  CameraPreset,
  Readonly<{
    position: readonly [number, number, number]
    target: readonly [number, number, number]
  }>
> = {
  coach: {
    position: [10.8, 10.4, 10.5],
    target: [0, 0.55, -5.6],
  },
  top: {
    position: [0.4, 18.4, 1.6],
    target: [0, 0.15, -6.6],
  },
  rim: {
    position: [0.3, 5.2, 5.3],
    target: [0, 1.35, -3.8],
  },
}

type CameraRigProps = Readonly<{
  preset: CameraPreset
}>

export function CameraRig({ preset }: CameraRigProps) {
  const { camera } = useThree()
  const reducedMotion = useReducedMotion()
  const settling = useRef(true)
  const position = useMemo(
    () => new Vector3(...PRESETS[preset].position),
    [preset],
  )
  const target = useMemo(
    () => new Vector3(...PRESETS[preset].target),
    [preset],
  )

  useEffect(() => {
    settling.current = true
  }, [preset])

  useFrame((_, delta) => {
    if (!settling.current) {
      return
    }
    const alpha = reducedMotion ? 1 : 1 - Math.exp(-delta * 5.2)
    camera.position.lerp(position, alpha)
    camera.lookAt(target)
    if (reducedMotion || camera.position.distanceTo(position) < 0.015) {
      camera.position.copy(position)
      camera.lookAt(target)
      settling.current = false
    }
  })

  return null
}
