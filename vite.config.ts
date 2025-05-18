import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Polyfill for process.env to fix "process is not defined" error
    'process.env': {},
    // Polyfill for util.inherits to fix "TypeError util.inherits is not a function" error
    'global': {},
  },
  resolve: {
    alias: {
      // Provide a browser-compatible version of the 'util' module
      //'util': './src/polyfills/util.js'
    }
  }
})
