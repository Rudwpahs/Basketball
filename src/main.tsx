import {
  Component,
  StrictMode,
  type ErrorInfo,
  type ReactNode,
} from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'

type AppErrorBoundaryProps = Readonly<{
  children: ReactNode
}>

type AppErrorBoundaryState = Readonly<{
  error: Error | null
}>

class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Basketball Playbook Lab render failure', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <main
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: '24px',
            background: '#f2ebdd',
            color: '#0b1320',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <section style={{ maxWidth: '680px' }}>
            <p style={{ margin: '0 0 8px', fontWeight: 800 }}>
              BASKETBALL PLAYBOOK LAB
            </p>
            <h1 style={{ margin: '0 0 12px' }}>화면을 불러오지 못했습니다.</h1>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              페이지를 새로고침해 주세요. 문제가 계속되면 브라우저 캐시에 남은
              이전 배포 파일을 지운 뒤 다시 접속해 주세요.
            </p>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}

const root = document.getElementById('root')

if (!root) {
  throw new Error('Missing #root element')
}

createRoot(root).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
