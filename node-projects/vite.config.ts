import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['scichart']
  },
  server: {
    port: 5173,
    strictPort: true,
    host: '0.0.0.0',
    hmr: {
      port: 5174,
    },
  },
})