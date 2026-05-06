import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd()); // eslint-disable-line no-undef
  return {
    base: env.VITE_BASE_PATH || '/',
    plugins: [react()],
    server: {
      port: 5174,
      proxy: {
      '/api': {
          target: 'http://localhost:3003',
          changeOrigin: true,
        },
      }
    }
  }
})
