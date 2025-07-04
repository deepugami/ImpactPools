import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  // Define aliases for cleaner imports
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  // Handle crypto polyfills for browser compatibility with Stellar SDK
  define: {
    global: 'globalThis',
    'process.env': {}
  },
  optimizeDeps: {
    include: ['@stellar/stellar-sdk', '@stellar/freighter-api']
  }
}) 