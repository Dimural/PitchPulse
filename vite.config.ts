import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true, // Automatically open browser
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true,
  },
  optimizeDeps: {
    exclude: ['@tensorflow/tfjs', '@tensorflow/tfjs-core', '@tensorflow/tfjs-converter'],
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
}) 