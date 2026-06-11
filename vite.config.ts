import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  server: { port: 3000 },
  plugins: [
    tanstackStart(),
    // Nitro is the deployment layer. On Vercel it auto-detects the platform
    // (VERCEL env var) and emits the Build Output API format (.vercel/output).
    nitro(),
    // react's plugin must come after start's plugin
    viteReact(),
  ],
})
