import { defineConfig } from 'vite'
import { resolve } from 'path'

// Each open role lives at /careers/<slug>/index.html. Bare /careers redirects
// to the currently-open role (mirrors the vercel.json redirect). And Vite's dev
// server only resolves a directory's index.html when the URL has a trailing
// slash, so we add it for the role path. Keeps `npm run dev` matching prod.
const OPEN_ROLE = '/careers/head-of-narrative'
function cleanUrlRewrite() {
  return {
    name: 'clean-url-rewrite',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = req.url.split('?')[0]
        // Bare /careers → redirect to the open role.
        if (path === '/careers' || path === '/careers/') {
          res.statusCode = 302
          res.setHeader('Location', OPEN_ROLE)
          res.end()
          return
        }
        // Role URL without trailing slash → add it so the dir index resolves.
        if (path === OPEN_ROLE) {
          req.url = OPEN_ROLE + '/' + req.url.slice(OPEN_ROLE.length)
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
        careers: resolve(__dirname, 'careers/head-of-narrative/index.html'),
      },
    },
  },
})
