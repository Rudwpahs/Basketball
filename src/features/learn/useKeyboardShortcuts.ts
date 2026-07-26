import { useEffect } from 'react'
import type { CameraPreset } from '../../scene/CameraRig'

type KeyboardActions = Readonly<{
  searchInput: HTMLInputElement | null
  drawerOpen: boolean
  onTogglePlayback: () => void
  onPrevious: () => void
  onNext: () => void
  onCameraChange: (preset: CameraPreset) => void
  onCloseDrawer: () => void
  onCloseQuiz: () => void
}>

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  )
}

export function useKeyboardShortcuts({
  searchInput,
  drawerOpen,
  onTogglePlayback,
  onPrevious,
  onNext,
  onCameraChange,
  onCloseDrawer,
  onCloseQuiz,
}: KeyboardActions) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseQuiz()
        if (drawerOpen) {
          onCloseDrawer()
        }
        return
      }

      if (isTypingTarget(event.target)) {
        return
      }

      switch (event.key) {
        case '/':
          event.preventDefault()
          searchInput?.focus()
          break
        case ' ':
          event.preventDefault()
          onTogglePlayback()
          break
        case 'ArrowLeft':
          event.preventDefault()
          onPrevious()
          break
        case 'ArrowRight':
          event.preventDefault()
          onNext()
          break
        case '1':
          onCameraChange('coach')
          break
        case '2':
          onCameraChange('top')
          break
        case '3':
          onCameraChange('rim')
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    drawerOpen,
    onCameraChange,
    onCloseDrawer,
    onCloseQuiz,
    onNext,
    onPrevious,
    onTogglePlayback,
    searchInput,
  ])
}
