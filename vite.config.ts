import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 800,
    rolldownOptions: {
      output: {
        codeSplitting: {
          minSize: 20_000,
          groups: [
            {
              name: 'three-core',
              test: /node_modules\/three\//,
            },
            {
              name: 'react-three',
              test: /node_modules\/@react-three\//,
            },
            {
              name: 'three-support',
              test:
                /node_modules\/(troika-three-text|three-mesh-bvh|maath|zustand|camera-controls)\//,
            },
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})
