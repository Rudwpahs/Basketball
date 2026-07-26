import { Camera, Goal, PanelsTopLeft } from 'lucide-react'
import type { CameraPreset } from '../../scene/CameraRig'

type CameraControlsProps = Readonly<{
  value: CameraPreset
  onChange: (preset: CameraPreset) => void
}>

const CAMERAS = [
  { id: 'coach', label: 'Coach', icon: PanelsTopLeft, key: '1' },
  { id: 'top', label: 'Top', icon: Camera, key: '2' },
  { id: 'rim', label: 'Rim', icon: Goal, key: '3' },
] as const

export function CameraControls({
  value,
  onChange,
}: CameraControlsProps) {
  return (
    <div className="camera-controls" aria-label="카메라 시점">
      {CAMERAS.map((camera) => {
        const Icon = camera.icon
        return (
          <button
            key={camera.id}
            type="button"
            aria-pressed={value === camera.id}
            onClick={() => onChange(camera.id)}
          >
            <Icon size={15} aria-hidden="true" />
            <span>{camera.label}</span>
            <kbd>{camera.key}</kbd>
          </button>
        )
      })}
    </div>
  )
}
