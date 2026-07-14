import { defineConfig } from 'vite'
import { resolve } from 'path'

// Vite's dev server only resolves a directory's index.html when the URL has
// a trailing slash. Production (vercel.json cleanUrls) already handles the
// bare "/careers" case; this mirrors that in dev so `npm run dev` matches.
function cleanUrlRewrite() {
  return {
    name: 'clean-url-rewrite',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/careers') {
          req.url = '/careers/'
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [cleanUrlRewrite()],
  server: {
    port: 5174,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        careers: resolve(__dirname, 'careers/index.html'),
      },
    },
  },
})
