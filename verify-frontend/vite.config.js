import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        fullAnalysis: resolve(__dirname, 'fullAnalysis.html'),
        popup: resolve(__dirname, 'popup.html'),
        iframe: resolve(__dirname, 'iframe.html'),
      },
    },
  },
})
