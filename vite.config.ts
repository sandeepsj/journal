import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  base: '/journal/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },
})
